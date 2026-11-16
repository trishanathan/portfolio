import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Read credentials safely from environment or .env.local without hardcoding secrets
let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
let SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  const envPath = path.join(rootDir, ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
        SUPABASE_URL = trimmed.split("=")[1].trim();
      } else if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
        SUPABASE_SERVICE_ROLE_KEY = trimmed.split("=")[1].trim();
      }
    }
  }
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log("Starting Supabase data seeding...");

  // 1. Seed Gallery
  try {
    const galleryData = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "gallery.json"), "utf8"));
    const records = galleryData.map((item, idx) => ({
      id: item.id || `gal-${idx + 1}`,
      name: item.name,
      category: item.category,
      src: item.src,
      note: item.note || null,
      created_at: item.createdAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from("gallery").upsert(records, { onConflict: "id" });
    if (error) {
      console.log("Gallery table not ready or error:", error.message);
    } else {
      console.log(`✅ Seeded ${records.length} gallery items into Supabase!`);
    }
  } catch (e) {
    console.log("Gallery seed skipped:", e.message);
  }

  // 2. Seed Filmography
  try {
    const filmData = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "filmography.json"), "utf8"));
    const records = filmData.map((f, idx) => ({
      id: f.id || `film-${idx + 1}`,
      title: f.title,
      role: f.role || null,
      lang: f.lang || "Hindi",
      year: f.year || null,
      poster: f.poster || null,
      imdb_url: f.imdbUrl || null,
      note: f.note || null,
      highlight: Boolean(f.highlight),
      created_at: f.createdAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from("filmography").upsert(records, { onConflict: "id" });
    if (error) {
      console.log("Filmography table not ready or error:", error.message);
    } else {
      console.log(`✅ Seeded ${records.length} films into Supabase!`);
    }
  } catch (e) {
    console.log("Filmography seed skipped:", e.message);
  }

  // 3. Seed Home Slides
  try {
    const slidesData = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "home-slides.json"), "utf8"));
    const records = slidesData.map((s, idx) => ({
      id: s.id || `slide-${idx + 1}`,
      title: s.title,
      subtitle: s.subtitle || null,
      src: s.src,
      alt: s.alt || s.title,
      created_at: s.createdAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from("home_slides").upsert(records, { onConflict: "id" });
    if (error) {
      console.log("Home slides table not ready or error:", error.message);
    } else {
      console.log(`✅ Seeded ${records.length} slides into Supabase!`);
    }
  } catch (e) {
    console.log("Slides seed skipped:", e.message);
  }

  // 4. Seed Articles
  try {
    const articlesData = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "articles.json"), "utf8"));
    const records = articlesData.map((a, idx) => ({
      id: a.id || `art-${idx + 1}`,
      title: a.title,
      publication: a.publication || "Press",
      date: a.date || "2024",
      link: a.link || null,
      image: a.image || null,
      summary: a.summary || null,
      category: a.category || "Feature",
      created_at: a.createdAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from("articles").upsert(records, { onConflict: "id" });
    if (error) {
      console.log("Articles table not ready or error:", error.message);
    } else {
      console.log(`✅ Seeded ${records.length} articles into Supabase!`);
    }
  } catch (e) {
    console.log("Articles seed skipped:", e.message);
  }

  console.log("Done.");
}

seed();

