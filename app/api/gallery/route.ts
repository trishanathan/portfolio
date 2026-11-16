import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { readDataFile, writeDataFile, sanitizeFileName } from "@/lib/content-manager";
import { verifyAdminPassword } from "@/lib/admin-auth";
import { getSupabaseServerClient, uploadImageToSupabase, deleteImageFromSupabase } from "@/lib/supabase";

export interface GalleryItem {
  id?: string;
  name: string;
  category: "Actors & Stars" | "Directors & Creators" | "Icons & Luminaries" | "Industry Events";
  src: string;
  note?: string;
  createdAt?: string;
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: GalleryItem[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          src: d.src,
          note: d.note || undefined,
          createdAt: d.created_at,
        }));
        return NextResponse.json(mapped, {
          headers: { "Cache-Control": "no-store, max-age=0" },
        });
      }
    } catch (e) {
      // Fallback to local file
    }
  }

  const items = readDataFile<GalleryItem[]>("gallery.json", []);
  return NextResponse.json(items, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const password = (formData.get("password") as string) || req.headers.get("x-admin-password") || "";

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Unauthorized. Incorrect password." }, { status: 401 });
    }

    const name = (formData.get("name") as string)?.trim();
    const category = (formData.get("category") as string)?.trim() as GalleryItem["category"];
    const note = (formData.get("note") as string)?.trim() || "";
    const existingImageUrl = (formData.get("imageUrl") as string)?.trim();
    const file = formData.get("file") as File | null;

    if (!name || !category) {
      return NextResponse.json({ error: "Name and Category are required." }, { status: 400 });
    }

    let imageSrc = existingImageUrl || "";

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const rawExt = path.extname(file.name) || ".jpg";
      const ext = rawExt.toLowerCase();
      const safeBase = sanitizeFileName(name) || "gallery-item";
      const fileName = `${Date.now()}-${safeBase}${ext}`;
      const mimeType = file.type || (ext === ".png" ? "image/png" : "image/jpeg");

      // 1. Upload to Supabase Storage (Cloud CDN)
      const cloudUrl = await uploadImageToSupabase(buffer, fileName, "gallery", mimeType);
      if (cloudUrl) {
        imageSrc = cloudUrl;
      }

      // 2. Also keep local copy as backup
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "gallery");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        if (!imageSrc) imageSrc = `/uploads/gallery/${fileName}`;
      } catch (localErr) {
        console.warn("Local file backup warning:", localErr);
      }
    }

    if (!imageSrc) {
      return NextResponse.json({ error: "An image file or valid image URL is required." }, { status: 400 });
    }

    const newItem: GalleryItem = {
      id: `gal-${Date.now()}`,
      name,
      category,
      src: imageSrc,
      note,
      createdAt: new Date().toISOString(),
    };

    // 3. Save to Supabase DB if table exists
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from("gallery").insert([
          {
            id: newItem.id,
            name: newItem.name,
            category: newItem.category,
            src: newItem.src,
            note: newItem.note || null,
            created_at: newItem.createdAt,
          },
        ]);
      } catch (dbErr) {
        console.warn("Supabase insert warning:", dbErr);
      }
    }

    // 4. Update local JSON storage
    const currentItems = readDataFile<GalleryItem[]>("gallery.json", []);
    const updated = [newItem, ...currentItems];
    writeDataFile("gallery.json", updated);

    return NextResponse.json({ success: true, item: newItem, total: updated.length });
  } catch (error: any) {
    console.error("Gallery upload error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process upload." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, src, name, password } = body;

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Unauthorized. Incorrect password." }, { status: 401 });
    }

    // 1. Delete from Supabase
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        if (id) await supabase.from("gallery").delete().eq("id", id);
        else if (src) await supabase.from("gallery").delete().eq("src", src);
        else if (name) await supabase.from("gallery").delete().eq("name", name);
      } catch (dbErr) {
        console.warn("Supabase delete warning:", dbErr);
      }
    }

    // 2. Delete from Supabase Storage if hosted there
    if (src && src.includes(".supabase.co/storage/")) {
      await deleteImageFromSupabase(src);
    }

    // 3. Delete from local JSON & local disk
    const currentItems = readDataFile<GalleryItem[]>("gallery.json", []);
    const updated = currentItems.filter((item) => {
      if (id && item.id) return item.id !== id;
      if (src) return item.src !== src;
      if (name) return item.name !== name;
      return true;
    });

    writeDataFile("gallery.json", updated);

    if (src && src.startsWith("/uploads/gallery/")) {
      const localPath = path.join(process.cwd(), "public", src);
      if (fs.existsSync(localPath)) {
        try {
          fs.unlinkSync(localPath);
        } catch (e) {
          console.warn("Could not delete local file:", e);
        }
      }
    }

    return NextResponse.json({ success: true, total: updated.length });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete item." }, { status: 500 });
  }
}
