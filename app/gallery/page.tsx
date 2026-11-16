"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

import initialGalleryData from "@/data/gallery.json";

interface GalleryItem {
  id?: string;
  name: string;
  category: "Actors & Stars" | "Directors & Creators" | "Icons & Luminaries" | "Industry Events";
  src: string;
  note?: string;
  createdAt?: string;
}

const categories = [
  "All",
  "Actors & Stars",
  "Directors & Creators",
  "Icons & Luminaries",
  "Industry Events",
] as const;

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>(initialGalleryData as GalleryItem[]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetch("/api/gallery")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        }
      })
      .catch((err) => console.error("Error fetching latest gallery:", err));
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsPlaying(false);
  };

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setIsPlaying(false);
  }, []);

  const nextImage = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => ((prev! + 1) % filteredItems.length));
  }, [lightboxIndex, filteredItems.length]);

  const prevImage = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! - 1 + filteredItems.length) % filteredItems.length);
  }, [lightboxIndex, filteredItems.length]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, nextImage, prevImage, closeLightbox]);

  /* Auto-play slideshow timer */
  useEffect(() => {
    if (!isPlaying || lightboxIndex === null) return;
    const timer = setInterval(() => {
      nextImage();
    }, 3000);
    return () => clearInterval(timer);
  }, [isPlaying, lightboxIndex, nextImage]);

  const currentItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

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
            <span className="text-[#1D4ED8] font-medium">Gallery</span>
          </div>

          <div className="section-label">Moments &amp; Associations</div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-[#0F172A] max-w-4xl leading-[1.12]">
            Industry Moments &amp; <span className="text-royal-gradient">Gallery</span>
          </h1>

          <p className="font-accent text-base sm:text-lg text-[#475569] max-w-3xl leading-relaxed">
            A visual retrospective of relationships, landmark film events, studio collaborations, and memorable moments with celebrated actors, visionary directors, and industry leaders over three decades.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200/80 font-accent text-xs text-[#1D4ED8]">
            <span>✨ Click any photo to view in Fullscreen Lightbox &amp; Slideshow Mode</span>
          </div>
        </div>
      </div>

      {/* ══ GALLERY GRID & CONTROLS ═════════════════════════════ */}
      <section className="py-16 px-6 relative min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {categories.map((cat) => {
                const count =
                  cat === "All"
                    ? items.length
                    : items.filter((item) => item.category === cat).length;
                const active = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full font-accent text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer border
                      ${
                        active
                          ? "bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white border-transparent shadow-[0_2px_12px_rgba(29,78,216,0.35)]"
                          : "bg-white text-[#475569] border-slate-200 hover:border-blue-300 hover:text-[#1D4ED8] shadow-sm"
                      }`}
                  >
                    <span>{cat}</span>
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

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search celebrity / event..."
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 pl-10 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20 outline-none shadow-sm"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#64748B] hover:text-[#0F172A] bg-transparent border-0 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-accent text-[#64748B] border-b border-slate-200/80 pb-3">
            <span>
              Showing <strong className="text-[#0F172A]">{filteredItems.length}</strong> photographs
            </span>
            <span className="text-[#1D4ED8] font-medium">Click any card to inspect in high definition</span>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredItems.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  onClick={() => openLightbox(index)}
                  className="group relative rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_40px_-5px_rgba(29,78,216,0.16)] hover:border-blue-300/90 -translate-y-0 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between"
                >
                  {/* Photo Frame Container */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100/70 flex items-center justify-center">
                    {/* Ambient Blurred Background Fill (Light & Elegant) */}
                    <Image
                      src={item.src}
                      alt=""
                      fill
                      className="object-cover blur-xl scale-125 opacity-30 pointer-events-none group-hover:scale-135 transition-transform duration-700 ease-out"
                      aria-hidden="true"
                    />

                    {/* Main High-Res Image */}
                    <Image
                      src={item.src}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-contain p-3 group-hover:scale-[1.04] transition-transform duration-500 ease-out z-10"
                      loading="lazy"
                    />

                    {/* Gradient overlay on image hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none" />

                    {/* Category Glass Pill */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-[0.65rem] font-accent font-bold uppercase tracking-wider text-[#1D4ED8] shadow-sm z-20">
                      {item.category}
                    </div>

                    {/* View Photo Floating Action Button */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-accent text-xs font-semibold tracking-wide shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-20 flex items-center gap-1.5 whitespace-nowrap">
                      <span>Inspect Photo</span>
                      <span className="text-[0.7rem]">🔍</span>
                    </div>
                  </div>

                  {/* Caption & Metadata Strip */}
                  <div className="p-4 bg-white border-t border-slate-100 relative z-20 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base text-[#0F172A] line-clamp-1 group-hover:text-[#1D4ED8] transition-colors m-0">
                        {item.name}
                      </h3>
                      {item.note && (
                        <p className="font-accent text-xs text-[#64748B] line-clamp-1 mt-1 m-0 font-medium">
                          {item.note}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[0.7rem] font-accent text-[#64748B] pt-2 border-t border-slate-100/70">
                      <span className="text-[#1D4ED8] font-semibold flex items-center gap-1">
                        <span>✨ High Definition</span>
                      </span>
                      <span className="text-[#94A3B8]">Click to expand</span>
                    </div>

                    {/* Hover Accent Line at bottom of card */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1D4ED8] via-[#38BDF8] to-[#2563EB] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 rounded-3xl glass-card border border-slate-200 space-y-4">
              <p className="text-4xl">📸</p>
              <p className="font-display text-xl text-[#0F172A]">No photos found for "{searchQuery}"</p>
              <p className="text-xs text-[#64748B]">Try clearing your search or browsing All categories.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="px-5 py-2 rounded-full font-accent text-xs font-semibold bg-[#1D4ED8] text-white cursor-pointer border-none shadow-sm"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══ FULLSCREEN LIGHTBOX MODAL ══════════════════════════ */}
      {lightboxIndex !== null && currentItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between text-white pb-3 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-accent text-xs text-[#60A5FA] font-bold uppercase tracking-wider">
                  {currentItem.category}
                </span>
                <span className="text-white/30">|</span>
                <span className="font-accent text-xs text-white/60">
                  Photo {lightboxIndex + 1} of {filteredItems.length}
                </span>
              </div>
              <h2 className="font-display text-lg sm:text-2xl font-bold text-white m-0">
                {currentItem.name}
              </h2>
              {currentItem.note && (
                <p className="font-accent text-xs text-blue-200 m-0">
                  {currentItem.note}
                </p>
              )}
            </div>

            {/* Modal Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3.5 py-1.5 rounded-full font-accent text-xs font-semibold border cursor-pointer transition-colors
                  ${
                    isPlaying
                      ? "bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-[0_0_15px_rgba(29,78,216,0.5)]"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  }`}
              >
                {isPlaying ? "⏸ Pause Slideshow" : "▶ Play Slideshow"}
              </button>
              <button
                onClick={closeLightbox}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg cursor-pointer border border-white/20 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Photo Center Display */}
          <div
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Nav Arrow */}
            <button
              onClick={prevImage}
              className="absolute left-2 sm:left-6 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-[#1D4ED8] text-white border border-white/20 flex items-center justify-center text-xl cursor-pointer transition-all duration-200 shadow-2xl"
              aria-label="Previous photograph"
            >
              ←
            </button>

            {/* Central High-Res Image */}
            <div className="relative w-full max-w-4xl h-full max-h-[70vh] flex items-center justify-center p-2">
              <div className="relative w-full h-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-white/15">
                <Image
                  src={currentItem.src}
                  alt={currentItem.name}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Right Nav Arrow */}
            <button
              onClick={nextImage}
              className="absolute right-2 sm:right-6 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-[#1D4ED8] text-white border border-white/20 flex items-center justify-center text-xl cursor-pointer transition-all duration-200 shadow-2xl"
              aria-label="Next photograph"
            >
              →
            </button>
          </div>

          {/* Bottom Thumbnail Strip */}
          <div
            className="border-t border-white/10 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-5xl mx-auto scrollbar-none">
              {filteredItems.map((thumb, idx) => (
                <button
                  key={`thumb-${idx}`}
                  onClick={() => openLightbox(idx)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer p-0 bg-transparent
                    ${
                      idx === lightboxIndex
                        ? "border-[#1D4ED8] scale-110 shadow-[0_0_15px_rgba(29,78,216,0.6)]"
                        : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                >
                  <Image
                    src={thumb.src}
                    alt={thumb.name}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="text-center font-accent text-[0.7rem] text-white/50 mt-2 mb-0">
              Use Left &amp; Right Arrow keys on your keyboard to navigate · Esc to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
