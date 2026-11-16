import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { readDataFile, writeDataFile, sanitizeFileName } from "@/lib/content-manager";
import { verifyAdminPassword } from "@/lib/admin-auth";
import { getSupabaseServerClient, uploadImageToSupabase, deleteImageFromSupabase } from "@/lib/supabase";

export interface Article {
  id: string;
  title: string;
  publication: string;
  date: string;
  link?: string;
  image?: string;
  summary: string;
  category?: string;
  createdAt?: string;
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: Article[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          publication: d.publication,
          date: d.date,
          link: d.link || undefined,
          image: d.image || undefined,
          summary: d.summary || "",
          category: d.category || undefined,
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

  const items = readDataFile<Article[]>("articles.json", []);
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
    const publication = (formData.get("publication") as string)?.trim() || "Press Feature";
    const date = (formData.get("date") as string)?.trim() || new Date().getFullYear().toString();
    const summary = (formData.get("summary") as string)?.trim() || "";
    const category = (formData.get("category") as string)?.trim() || "Feature";
    const link = (formData.get("link") as string)?.trim() || "";
    const existingImageUrl = (formData.get("imageUrl") as string)?.trim();
    const file = formData.get("file") as File | null;

    if (!title) {
      return NextResponse.json({ error: "Article Title is required." }, { status: 400 });
    }

    let imageSrc = existingImageUrl || "";

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const rawExt = path.extname(file.name) || ".jpg";
      const ext = rawExt.toLowerCase();
      const safeBase = sanitizeFileName(title) || "article-image";
      const fileName = `${Date.now()}-${safeBase}${ext}`;
      const mimeType = file.type || (ext === ".png" ? "image/png" : "image/jpeg");

      // 1. Upload to Supabase Storage
      const cloudUrl = await uploadImageToSupabase(buffer, fileName, "articles", mimeType);
      if (cloudUrl) imageSrc = cloudUrl;

      // 2. Local backup
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "articles");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        if (!imageSrc) imageSrc = `/uploads/articles/${fileName}`;
      } catch (localErr) {
        console.warn("Local file backup warning:", localErr);
      }
    }

    const newArticle: Article = {
      id: `art-${Date.now()}`,
      title,
      publication,
      date,
      summary,
      category,
      link: link || undefined,
      image: imageSrc || undefined,
      createdAt: new Date().toISOString(),
    };

    // 3. Save to Supabase Table
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from("articles").insert([
          {
            id: newArticle.id,
            title: newArticle.title,
            publication: newArticle.publication,
            date: newArticle.date,
            link: newArticle.link || null,
            image: newArticle.image || null,
            summary: newArticle.summary,
            category: newArticle.category || null,
            created_at: newArticle.createdAt,
          },
        ]);
      } catch (dbErr) {
        console.warn("Supabase insert warning:", dbErr);
      }
    }

    // 4. Update local JSON storage
    const current = readDataFile<Article[]>("articles.json", []);
    const updated = [newArticle, ...current];
    writeDataFile("articles.json", updated);

    return NextResponse.json({ success: true, item: newArticle, total: updated.length });
  } catch (error: any) {
    console.error("Article upload error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process upload." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, password } = body;

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Unauthorized. Incorrect password." }, { status: 401 });
    }

    const current = readDataFile<Article[]>("articles.json", []);
    const toDelete = current.find((a) => a.id === id);

    // 1. Delete from Supabase Table
    const supabase = getSupabaseServerClient();
    if (supabase && id) {
      try {
        await supabase.from("articles").delete().eq("id", id);
      } catch (dbErr) {
        console.warn("Supabase delete warning:", dbErr);
      }
    }

    // 2. Delete from Supabase Storage
    if (toDelete?.image && toDelete.image.includes(".supabase.co/storage/")) {
      await deleteImageFromSupabase(toDelete.image);
    }

    // 3. Delete from local JSON & local disk
    const updated = current.filter((a) => a.id !== id);
    writeDataFile("articles.json", updated);

    if (toDelete?.image && toDelete.image.startsWith("/uploads/articles/")) {
      const localPath = path.join(process.cwd(), "public", toDelete.image);
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
    return NextResponse.json({ error: error?.message || "Failed to delete article." }, { status: 500 });
  }
}
