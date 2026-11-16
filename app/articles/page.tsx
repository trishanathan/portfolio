"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import initialArticles from "@/data/articles.json";

export interface Article {
  id: string;
  title: string;
  publication: string;
  date: string;
  link?: string;
  image?: string;
  summary: string;
  category?: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>(initialArticles as Article[]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
        }
      })
      .catch((err) => console.error("Error fetching articles:", err));
  }, []);

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.publication.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* ══ HEADER BANNER ══════════════════════════════════════ */}
      <div className="relative pt-36 pb-16 px-6 overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50 to-blue-50/20 text-[#0F172A]">
        {/* Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-[450px] h-[450px] bg-sky-400/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-xs text-[#64748B] font-accent">
            <Link href="/" className="no-underline text-[#64748B] hover:text-[#1D4ED8] transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#1D4ED8] font-medium">Articles &amp; Media</span>
          </div>

          <div className="section-label">Press, Media &amp; Thought Leadership</div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F172A]">
                Articles &amp; <span className="text-royal-gradient">Insights</span>
              </h1>
              <p className="font-accent text-sm sm:text-base text-[#475569] max-w-2xl pt-2">
                Thought leadership, interviews, and media perspectives across studio distribution, commercial marketing, rights syndication, and entertainment technology.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 font-accent text-xs font-semibold text-[#1D4ED8] shadow-sm">
                {articles.length} Publications
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ARTICLES GRID ═════════════════════════════════════ */}
      <section className="py-16 px-6 relative min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Search Bar */}
          <div className="max-w-md relative">
            <input
              type="text"
              placeholder="Search by publication, title, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm text-sm font-accent text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="group rounded-3xl bg-white border border-slate-200/80 hover:border-blue-300 shadow-sm hover:shadow-[0_12px_32px_rgba(29,78,216,0.1)] transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {article.image && (
                      <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {article.category && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[0.65rem] font-accent font-bold uppercase tracking-wider text-white">
                            {article.category}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-[#64748B] font-accent">
                        <span className="font-semibold text-[#1D4ED8]">{article.publication}</span>
                        <span>{article.date}</span>
                      </div>
                      <h2 className="font-display text-lg font-bold text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="font-accent text-xs sm:text-sm text-[#475569] leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between">
                    {article.link ? (
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-accent font-semibold text-[#1D4ED8] hover:text-[#1E40AF] no-underline transition-colors"
                      >
                        <span>Read Feature</span>
                        <span>↗</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 font-accent">Archived Feature</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center mx-auto text-2xl font-bold">
                📰
              </div>
              <h3 className="font-display text-xl font-bold text-[#0F172A]">No articles found</h3>
              <p className="font-accent text-sm text-[#64748B]">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
