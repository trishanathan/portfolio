"use client";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import initialFilmographyData from "@/data/filmography.json";

interface Film {
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

const languageFilters = [
  "All",
  "Hindi",
  "English",
  "Tamil",
  "Malayalam",
  "Marathi",
  "Punjabi",
  "Multi-Language",
] as const;

const langThemeColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  Hindi: { bg: "bg-blue-500/10", text: "text-[#1D4ED8]", border: "border-blue-500/25", gradient: "from-blue-700 to-slate-950" },
  English: { bg: "bg-sky-500/10", text: "text-sky-700", border: "border-sky-500/25", gradient: "from-sky-700 to-indigo-950" },
  Marathi: { bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-500/25", gradient: "from-rose-700 to-red-950" },
  Tamil: { bg: "bg-indigo-500/10", text: "text-indigo-700", border: "border-indigo-500/25", gradient: "from-indigo-700 to-slate-950" },
  Malayalam: { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-500/25", gradient: "from-emerald-700 to-teal-950" },
  Punjabi: { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-500/25", gradient: "from-amber-700 to-orange-950" },
  "Multi-Language": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500/25", gradient: "from-orange-700 to-amber-950" },
};

function FilmPosterCard({ film, onSelect }: { film: Film; onSelect: () => void }) {
  const [imgError, setImgError] = useState(false);
  const theme = langThemeColors[film.lang] || langThemeColors.Hindi;

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-2xl overflow-hidden glass-card-interactive cursor-pointer border flex flex-col justify-between transition-all duration-300
        ${film.highlight ? "border-blue-400/90 shadow-[0_8px_24px_rgba(29,78,216,0.12)] ring-1 ring-blue-300/40" : "border-slate-200/90 shadow-sm hover:border-blue-300"}`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        {film.poster && !imgError ? (
          <Image
            src={film.poster}
            alt={`${film.title} Poster`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${theme.gradient} p-4 flex flex-col justify-between relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-black pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[0.6rem] font-accent font-bold uppercase tracking-wider text-white border border-white/20">
                {film.lang}
              </span>
              {film.year && (
                <span className="text-[0.7rem] font-accent text-sky-200 font-semibold">
                  {film.year}
                </span>
              )}
            </div>

            <div className="z-10 space-y-0.5 my-auto text-center py-2">
              <span className="text-2xl block mb-1 opacity-80">🎬</span>
              <h4 className="font-display font-bold text-base sm:text-lg text-white leading-tight drop-shadow-md">
                {film.title}
              </h4>
            </div>

            <div className="z-10 text-center">
              <p className="font-accent text-[0.6rem] text-white/80 uppercase tracking-widest font-medium m-0">
                Cinema Portfolio
              </p>
            </div>
          </div>
        )}

        {/* Ambient Dark Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-50 group-hover:opacity-85 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20">
          <span className={`px-2 py-0.5 rounded-full backdrop-blur-md font-accent text-[0.6rem] font-bold uppercase tracking-wider shadow-sm ${theme.bg} ${theme.text} bg-white/95 border ${theme.border}`}>
            {film.lang}
          </span>
          
          {/* Official IMDb Badge on Card */}
          {film.imdbUrl && (
            <a
              href={film.imdbUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-0.5 rounded bg-[#F5C518] hover:bg-[#e2b616] text-black font-accent text-[0.62rem] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-0.5 no-underline transition-transform hover:scale-105"
              title={`Open ${film.title} on IMDb`}
            >
              <span>IMDb</span>
              <span className="text-[0.55rem]">↗</span>
            </a>
          )}
        </div>

        {/* Hover Inspect Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <div className="w-9 h-9 rounded-full bg-white/95 text-[#1D4ED8] flex items-center justify-center text-sm font-bold shadow-2xl scale-75 group-hover:scale-100 transition-transform">
            🔍
          </div>
        </div>

        {/* Bottom Details on Poster */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10 transform translate-y-0.5 group-hover:translate-y-0 transition-transform">
          <div className="flex items-baseline justify-between gap-1">
            <h3 className="font-display text-sm sm:text-base font-bold text-white drop-shadow m-0 leading-snug truncate">
              {film.title}
            </h3>
            {film.year && (
              <span className="font-accent text-[0.7rem] font-semibold text-sky-200 drop-shadow shrink-0">
                {film.year}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Caption Strip Under Poster */}
      <div className="p-3 bg-white border-t border-slate-100 flex-1 flex flex-col justify-between">
        <div>
          <p className="font-accent text-[0.72rem] text-[#64748B] leading-snug m-0 line-clamp-2 group-hover:text-[#334155] transition-colors">
            <strong className="text-[#0F172A] font-semibold">Role:</strong> {film.role}
          </p>
          {film.note && (
            <p className="font-accent text-[0.68rem] text-[#1D4ED8] mt-0.5 m-0 font-medium truncate">
              ✨ {film.note}
            </p>
          )}
        </div>

        <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[0.68rem] font-accent text-[#64748B]">
          {film.imdbUrl ? (
            <a
              href={film.imdbUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#D97706] hover:text-[#B45309] font-bold flex items-center gap-1 no-underline"
            >
              <span className="px-1.5 py-0.5 rounded bg-[#F5C518] text-black text-[0.6rem]">IMDb</span>
              <span>Link ↗</span>
            </a>
          ) : (
            <span>Details</span>
          )}
          <span className="text-[#1D4ED8] font-bold group-hover:translate-x-0.5 transition-transform">→</span>
        </div>
      </div>
    </div>
  );
}

export default function FilmographyPage() {
  const [films, setFilms] = useState<Film[]>(initialFilmographyData as Film[]);
  const [selectedLang, setSelectedLang] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalFilm, setActiveModalFilm] = useState<Film | null>(null);

  useEffect(() => {
    fetch("/api/filmography")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFilms(data);
        }
      })
      .catch((err) => console.error("Error fetching latest filmography:", err));
  }, []);

  const filteredFilms = useMemo(() => {
    return films.filter((film) => {
      const matchLang = selectedLang === "All" || film.lang === selectedLang;
      const matchSearch =
        film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        film.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (film.note && film.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (film.year && film.year.includes(searchQuery));
      return matchLang && matchSearch;
    });
  }, [films, selectedLang, searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModalFilm(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* ══ HEADER BANNER ══════════════════════════════════════ */}
      <div className="relative pt-36 pb-16 px-6 overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50 to-blue-50/20 text-[#0F172A]">
        {/* Creative Cinematic Transparent Watermark Background Banner Image */}
        <div className="absolute inset-0 z-0 opacity-15 mix-blend-multiply pointer-events-none">
          <Image
            src="/assets/filmography_banner.jpg"
            alt=""
            fill
            className="object-cover object-center scale-105"
            priority
          />
        </div>

        {/* Ambient Soft Luminous Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[110px] pointer-events-none z-0" />
        <div className="absolute top-1/3 left-10 w-[450px] h-[450px] bg-sky-400/10 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-xs text-[#64748B] font-accent">
            <Link href="/" className="no-underline text-[#64748B] hover:text-[#1D4ED8] transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#1D4ED8] font-medium">Filmography</span>
          </div>

          <div className="section-label">Cinema Legacy &amp; Posters</div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-[#0F172A] max-w-4xl leading-[1.12]">
            Filmography &amp; <span className="text-royal-gradient">Releases</span>
          </h1>

          <p className="font-accent text-base sm:text-lg text-[#475569] max-w-3xl leading-relaxed">
            <span className="text-[#0F172A] font-semibold">120+ films</span> across Hindi, English, Tamil, Malayalam, Marathi, Punjabi and Multi-Language cinema. Explore visual posters, release titles, direct IMDb links, and commercial distribution leadership.
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="px-4 py-2 rounded-xl bg-white/90 border border-slate-200/80 shadow-sm font-accent text-xs text-[#475569]">
              <span className="text-[#1D4ED8] font-bold text-sm">120+</span> Film Releases &amp; Posters
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/90 border border-slate-200/80 shadow-sm font-accent text-xs text-[#475569]">
              <span className="text-[#0284C7] font-bold text-sm">6+</span> Languages
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/90 border border-slate-200/80 shadow-sm font-accent text-xs text-[#475569]">
              <span className="text-[#D97706] font-bold text-sm">3</span> National Awards (Ventilator)
            </div>
          </div>
        </div>
      </div>

      {/* ══ INTERACTIVE DIRECTORY ══════════════════════════════ */}
      <section className="py-16 px-6 relative min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Controls: Search & Language Filters */}
          <div className="space-y-6">
            {/* Search Input */}
            <div className="relative max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search film title, role or year (e.g. PK, Avengers, Ventilator)..."
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 pl-11 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20 outline-none shadow-sm"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#64748B]">
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#64748B] hover:text-[#0F172A] bg-transparent border-0 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Language Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {languageFilters.map((lang) => {
                const count =
                  lang === "All"
                    ? films.length
                    : films.filter((f) => f.lang === lang).length;
                const active = selectedLang === lang;

                return (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-4 py-2 rounded-full font-accent text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer border
                      ${
                        active
                          ? "bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white border-transparent shadow-[0_2px_12px_rgba(29,78,216,0.35)]"
                          : "bg-white text-[#475569] border-slate-200 hover:border-blue-300 hover:text-[#1D4ED8] shadow-sm"
                      }`}
                  >
                    <span>{lang}</span>
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[0.65rem] ${
                        active ? "bg-white/20 text-white" : "bg-slate-100 text-[#64748B]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs font-accent text-[#64748B] border-b border-slate-200/80 pb-3">
            <span>
              Showing <strong className="text-[#0F172A]">{filteredFilms.length}</strong> of {films.length} cinematic titles
            </span>
            <span className="text-[#1D4ED8] font-medium">Click any card to inspect poster &amp; IMDb page</span>
          </div>

          {/* Films Poster Grid */}
          {filteredFilms.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
              {filteredFilms.map((film, index) => (
                <FilmPosterCard
                  key={`${film.title}-${index}`}
                  film={film}
                  onSelect={() => setActiveModalFilm(film)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-3xl glass-card border border-slate-200 space-y-4">
              <p className="text-4xl">🎬</p>
              <p className="font-display text-xl text-[#0F172A]">No films matching "{searchQuery}"</p>
              <p className="text-xs text-[#64748B]">Try clearing your search query or selecting a different language tab.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLang("All");
                }}
                className="px-5 py-2 rounded-full font-accent text-xs font-semibold bg-[#1D4ED8] text-white cursor-pointer border-none shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══ FILM DETAIL & POSTER MODAL ════════════════════════ */}
      {activeModalFilm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={() => setActiveModalFilm(null)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveModalFilm(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-900/80 text-white flex items-center justify-center cursor-pointer border-none shadow-md hover:bg-[#1D4ED8] transition-colors"
            >
              ✕
            </button>

            {/* Poster Left */}
            <div className="md:w-1/2 relative aspect-[2/3] bg-slate-900">
              {activeModalFilm.poster ? (
                <Image
                  src={activeModalFilm.poster}
                  alt={activeModalFilm.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-blue-700 to-slate-900 text-white">
                  <span className="text-5xl mb-3">🎬</span>
                  <h3 className="font-display text-2xl font-bold">{activeModalFilm.title}</h3>
                  <p className="font-accent text-xs text-sky-200 mt-2">{activeModalFilm.lang} Cinema</p>
                </div>
              )}
            </div>

            {/* Content Right */}
            <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-accent font-bold uppercase tracking-wider text-[#1D4ED8]">
                    {activeModalFilm.lang}
                  </span>
                  {activeModalFilm.year && (
                    <span className="text-xs font-accent text-[#64748B] font-semibold">
                      Released {activeModalFilm.year}
                    </span>
                  )}
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] leading-tight m-0">
                  {activeModalFilm.title}
                </h2>

                {activeModalFilm.highlight && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-accent font-bold text-[#D97706]">
                    ⭐ Landmark Release / Award Recognition
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <p className="font-accent text-xs font-bold uppercase tracking-wider text-[#64748B] m-0">
                    Prakash Nathan's Role &amp; Contribution
                  </p>
                  <p className="font-accent text-sm text-[#0F172A] font-semibold leading-relaxed m-0">
                    {activeModalFilm.role}
                  </p>
                </div>

                {activeModalFilm.note && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-accent text-[#475569]">
                    {activeModalFilm.note}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                {activeModalFilm.imdbUrl && (
                  <a
                    href={activeModalFilm.imdbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full font-accent font-extrabold text-xs uppercase tracking-wider no-underline bg-[#F5C518] hover:bg-[#e2b616] text-black shadow-md flex items-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <span>View on IMDb</span>
                    <span className="text-sm">↗</span>
                  </a>
                )}
                <Link
                  href="/contact"
                  onClick={() => setActiveModalFilm(null)}
                  className="px-5 py-2.5 rounded-full font-accent font-bold text-xs uppercase tracking-wider no-underline bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white shadow-sm"
                >
                  Consult On Similar Projects →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ COLLABORATION CALLOUT ═════════════════════════════ */}
      <section className="relative py-20 px-6 text-center border-t border-slate-200/80 bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="section-label">Commercial Collaboration</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0F172A]">
            Planning Your Next Film Release or Syndication Strategy?
          </h2>
          <p className="font-accent text-sm sm:text-base text-[#475569]">
            Benefit from 30+ years of distribution logistics, marketing consultancy, and commercial monetization expertise.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-accent font-bold text-xs uppercase tracking-wider no-underline
                bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white shadow-[0_4px_25px_rgba(29,78,216,0.35)] hover:shadow-[0_8px_35px_rgba(29,78,216,0.5)] hover:scale-105 transition-all duration-200"
            >
              Get In Touch →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
