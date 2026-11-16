import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { readDataFile, writeDataFile, sanitizeFileName } from "@/lib/content-manager";
import { verifyAdminPassword } from "@/lib/admin-auth";
import { getSupabaseServerClient, uploadImageToSupabase, deleteImageFromSupabase } from "@/lib/supabase";

export interface Film {
  id?: string;
  title: string;
  role: string;
  lang: "Hindi" | "English" | "Tamil" | "Malayalam" | "Marathi" | "Punjabi" | "Multi-Language";
  poster?: string;
  year?: string;
  note?: string;
  highlight?: boolean;
  imdbUrl?: string;
  createdAt?: string;
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("filmography")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: Film[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          role: d.role,
          lang: d.lang,
          year: d.year,
          poster: d.poster || undefined,
          imdbUrl: d.imdb_url || undefined,
          note: d.note || undefined,
          highlight: Boolean(d.highlight),
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

  const items = readDataFile<Film[]>("filmography.json", []);
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
    const role = (formData.get("role") as string)?.trim() || "Marketing & Distribution";
    const lang = ((formData.get("lang") as string)?.trim() as Film["lang"]) || "Hindi";
    const year = (formData.get("year") as string)?.trim() || new Date().getFullYear().toString();
    const imdbUrl = (formData.get("imdbUrl") as string)?.trim() || "";
    const note = (formData.get("note") as string)?.trim() || "";
    const highlight = formData.get("highlight") === "true";
    const existingPosterUrl = (formData.get("posterUrl") as string)?.trim();
    const file = formData.get("file") as File | null;

    if (!title) {
      return NextResponse.json({ error: "Film Title is required." }, { status: 400 });
    }

    let posterSrc = existingPosterUrl || "";

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const rawExt = path.extname(file.name) || ".jpg";
      const ext = rawExt.toLowerCase();
      const safeBase = sanitizeFileName(title) || "film-poster";
      const fileName = `${Date.now()}-${safeBase}${ext}`;
      const mimeType = file.type || (ext === ".png" ? "image/png" : "image/jpeg");

      // 1. Upload to Supabase Storage
      const cloudUrl = await uploadImageToSupabase(buffer, fileName, "films", mimeType);
      if (cloudUrl) posterSrc = cloudUrl;

      // 2. Local backup
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "films");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        if (!posterSrc) posterSrc = `/uploads/films/${fileName}`;
      } catch (localErr) {
        console.warn("Local file backup warning:", localErr);
      }
    }

    const newFilm: Film = {
      id: `film-${Date.now()}`,
      title,
      role,
      lang,
      year,
      highlight,
      poster: posterSrc || undefined,
      imdbUrl: imdbUrl || undefined,
      note: note || undefined,
      createdAt: new Date().toISOString(),
    };

    // 3. Save to Supabase Table
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from("filmography").insert([
          {
            id: newFilm.id,
            title: newFilm.title,
            role: newFilm.role,
            lang: newFilm.lang,
            year: newFilm.year,
            poster: newFilm.poster || null,
            imdb_url: newFilm.imdbUrl || null,
            note: newFilm.note || null,
            highlight: newFilm.highlight,
            created_at: newFilm.createdAt,
          },
        ]);
      } catch (dbErr) {
        console.warn("Supabase insert warning:", dbErr);
      }
    }

    // 4. Update local JSON storage
    const currentFilms = readDataFile<Film[]>("filmography.json", []);
    const updated = [newFilm, ...currentFilms];
    writeDataFile("filmography.json", updated);

    return NextResponse.json({ success: true, item: newFilm, total: updated.length });
  } catch (error: any) {
    console.error("Film upload error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process upload." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, title, poster, password } = body;

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Unauthorized. Incorrect password." }, { status: 401 });
    }

    // 1. Delete from Supabase Table
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        if (id) await supabase.from("filmography").delete().eq("id", id);
        else if (title) await supabase.from("filmography").delete().eq("title", title);
      } catch (dbErr) {
        console.warn("Supabase delete warning:", dbErr);
      }
    }

    // 2. Delete from Supabase Storage
    if (poster && poster.includes(".supabase.co/storage/")) {
      await deleteImageFromSupabase(poster);
    }

    // 3. Delete from local JSON
    const currentFilms = readDataFile<Film[]>("filmography.json", []);
    const updated = currentFilms.filter((f) => {
      if (id && f.id) return f.id !== id;
      if (title && f.title.toLowerCase() === title.toLowerCase()) return false;
      return true;
    });

    writeDataFile("filmography.json", updated);

    if (poster && poster.startsWith("/uploads/films/")) {
      const localPath = path.join(process.cwd(), "public", poster);
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
    return NextResponse.json({ error: error?.message || "Failed to delete film." }, { status: 500 });
  }
}
