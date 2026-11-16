import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { readDataFile, writeDataFile, sanitizeFileName } from "@/lib/content-manager";
import { verifyAdminPassword } from "@/lib/admin-auth";
import { getSupabaseServerClient, uploadImageToSupabase, deleteImageFromSupabase } from "@/lib/supabase";

export interface CoverflowSlide {
  id?: string;
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  createdAt?: string;
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("home_slides")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: CoverflowSlide[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          subtitle: d.subtitle || "",
          src: d.src,
          alt: d.alt || d.title,
          createdAt: d.created_at,
        }));
        return NextResponse.json(mapped, {
          headers: { "Cache-Control": "no-store, max-age=0" },
        });
      }
    } catch (e) {
      // Fallback
    }
  }

  const items = readDataFile<CoverflowSlide[]>("home-slides.json", []);
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

    const title = (formData.get("title") as string)?.trim();
    const subtitle = (formData.get("subtitle") as string)?.trim() || "";
    const alt = (formData.get("alt") as string)?.trim() || title;
    const existingImageUrl = (formData.get("imageUrl") as string)?.trim();
    const file = formData.get("file") as File | null;

    if (!title) {
      return NextResponse.json({ error: "Slide Title is required." }, { status: 400 });
    }

    let imageSrc = existingImageUrl || "";

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const rawExt = path.extname(file.name) || ".jpg";
      const ext = rawExt.toLowerCase();
      const safeBase = sanitizeFileName(title) || "slide-image";
      const fileName = `${Date.now()}-${safeBase}${ext}`;
      const mimeType = file.type || (ext === ".png" ? "image/png" : "image/jpeg");

      // 1. Upload to Supabase Storage
      const cloudUrl = await uploadImageToSupabase(buffer, fileName, "slides", mimeType);
      if (cloudUrl) imageSrc = cloudUrl;

      // 2. Local backup
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "slides");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        if (!imageSrc) imageSrc = `/uploads/slides/${fileName}`;
      } catch (localErr) {
        console.warn("Local file backup warning:", localErr);
      }
    }

    if (!imageSrc) {
      return NextResponse.json({ error: "An image file or image URL is required." }, { status: 400 });
    }

    const newSlide: CoverflowSlide = {
      id: `slide-${Date.now()}`,
      src: imageSrc,
      alt,
      title,
      subtitle,
      createdAt: new Date().toISOString(),
    };

    // 3. Save to Supabase Table
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from("home_slides").insert([
          {
            id: newSlide.id,
            title: newSlide.title,
            subtitle: newSlide.subtitle,
            src: newSlide.src,
            alt: newSlide.alt,
            created_at: newSlide.createdAt,
          },
        ]);
      } catch (dbErr) {
        console.warn("Supabase insert warning:", dbErr);
      }
    }

    // 4. Update local JSON storage
    const currentSlides = readDataFile<CoverflowSlide[]>("home-slides.json", []);
    const updated = [newSlide, ...currentSlides];
    writeDataFile("home-slides.json", updated);

    return NextResponse.json({ success: true, item: newSlide, total: updated.length });
  } catch (error: any) {
    console.error("Slide upload error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process upload." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, src, title, password } = body;

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Unauthorized. Incorrect password." }, { status: 401 });
    }

    // 1. Delete from Supabase Table
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        if (id) await supabase.from("home_slides").delete().eq("id", id);
        else if (title) await supabase.from("home_slides").delete().eq("title", title);
      } catch (dbErr) {
        console.warn("Supabase delete warning:", dbErr);
      }
    }

    // 2. Delete from Supabase Storage
    if (src && src.includes(".supabase.co/storage/")) {
      await deleteImageFromSupabase(src);
    }

    // 3. Delete from local JSON
    const currentSlides = readDataFile<CoverflowSlide[]>("home-slides.json", []);
    const updated = currentSlides.filter((s) => {
      if (id && s.id) return s.id !== id;
      if (src && s.src === src) return false;
      if (title && s.title.toLowerCase() === title.toLowerCase()) return false;
      return true;
    });

    writeDataFile("home-slides.json", updated);

    if (src && src.startsWith("/uploads/slides/")) {
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
    return NextResponse.json({ error: error?.message || "Failed to delete slide." }, { status: 500 });
  }
}
