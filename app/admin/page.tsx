"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

type TabType = "gallery" | "filmography" | "slides" | "articles";

export default function AdminPage() {
  // Authentication state (Strict: In-memory only, re-authenticates on refresh/navigate away)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [mfaCodeInput, setMfaCodeInput] = useState<string>("");
  const [savedPassword, setSavedPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Active section tab
  const [activeTab, setActiveTab] = useState<TabType>("gallery");

  // Notification toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Gallery Form State
  const [galleryName, setGalleryName] = useState("");
  const [galleryCategory, setGalleryCategory] = useState("Actors & Stars");
  const [galleryNote, setGalleryNote] = useState("");
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryPreview, setGalleryPreview] = useState<string>("");
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [gallerySearch, setGallerySearch] = useState("");
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Filmography Form State
  const [filmTitle, setFilmTitle] = useState("");
  const [filmRole, setFilmRole] = useState("Marketing, Distribution & Syndication");
  const [filmLang, setFilmLang] = useState("Hindi");
  const [filmYear, setFilmYear] = useState(new Date().getFullYear().toString());
  const [filmImdb, setFilmImdb] = useState("");
  const [filmNote, setFilmNote] = useState("");
  const [filmHighlight, setFilmHighlight] = useState(false);
  const [filmFile, setFilmFile] = useState<File | null>(null);
  const [filmPreview, setFilmPreview] = useState<string>("");
  const [filmItems, setFilmItems] = useState<any[]>([]);
  const [filmSearch, setFilmSearch] = useState("");
  const filmFileInputRef = useRef<HTMLInputElement>(null);

  // Home Slides Form State
  const [slideTitle, setSlideTitle] = useState("");
  const [slideSubtitle, setSlideSubtitle] = useState("");
  const [slideAlt, setSlideAlt] = useState("");
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [slidePreview, setSlidePreview] = useState<string>("");
  const [slideItems, setSlideItems] = useState<any[]>([]);
  const slideFileInputRef = useRef<HTMLInputElement>(null);

  // Articles Form State
  const [articleTitle, setArticleTitle] = useState("");
  const [articlePublication, setArticlePublication] = useState("");
  const [articleDate, setArticleDate] = useState(new Date().getFullYear().toString());
  const [articleSummary, setArticleSummary] = useState("");
  const [articleCategory, setArticleCategory] = useState("Press Feature");
  const [articleLink, setArticleLink] = useState("");
  const [articleFile, setArticleFile] = useState<File | null>(null);
  const [articlePreview, setArticlePreview] = useState<string>("");
  const [articleItems, setArticleItems] = useState<any[]>([]);
  const articleFileInputRef = useRef<HTMLInputElement>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show Toast
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Security: Clear any old storage so authentication is fresh every visit
  useEffect(() => {
    sessionStorage.clear();
    localStorage.removeItem("pn_admin_pw");
    localStorage.removeItem("pn_admin_auth");

    // Re-lock immediately if user navigates back or leaves
    const lockSession = () => {
      setIsAuthenticated(false);
      setSavedPassword("");
      sessionStorage.clear();
    };

    window.addEventListener("pagehide", lockSession);
    window.addEventListener("beforeunload", lockSession);
    return () => {
      window.removeEventListener("pagehide", lockSession);
      window.removeEventListener("beforeunload", lockSession);
    };
  }, []);

  // Fetch all data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    refreshData();
  }, [isAuthenticated]);

  const refreshData = async () => {
    try {
      const [galRes, filmRes, slidesRes, artRes] = await Promise.all([
        fetch("/api/gallery"),
        fetch("/api/filmography"),
        fetch("/api/home-slides"),
        fetch("/api/articles"),
      ]);

      if (galRes.ok) setGalleryItems(await galRes.json());
      if (filmRes.ok) setFilmItems(await filmRes.json());
      if (slidesRes.ok) setSlideItems(await slidesRes.json());
      if (artRes.ok) setArticleItems(await artRes.json());
    } catch (e) {
      console.error("Failed to load items:", e);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setAuthError("Please enter the admin password.");
      return;
    }
    if (!mfaCodeInput.trim() || mfaCodeInput.trim().length !== 6) {
      setAuthError("Please enter the 6-digit code from Microsoft Authenticator.");
      return;
    }

    setIsVerifying(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput, mfaCode: mfaCodeInput }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsAuthenticated(true);
        setSavedPassword(passwordInput);
      } else {
        setIsAuthenticated(false);
        setAuthError(data.error || "Authentication failed.");
      }
    } catch {
      setAuthError("Network error checking authentication.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("pn_admin_pw");
    localStorage.removeItem("pn_admin_auth");
    setIsAuthenticated(false);
    setSavedPassword("");
    setPasswordInput("");
    setMfaCodeInput("");
  };

  // File picker handler
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  // 1. Submit Gallery Upload
  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryFile) {
      showToast("Please choose an image file to upload.", "error");
      return;
    }
    if (!galleryName.trim()) {
      showToast("Please enter a name or personality title.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", galleryFile);
      fd.append("name", galleryName);
      fd.append("category", galleryCategory);
      fd.append("note", galleryNote);
      fd.append("password", savedPassword);

      const res = await fetch("/api/gallery", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
      } else {
        showToast("Photo added successfully to Gallery!");
        setGalleryName("");
        setGalleryNote("");
        setGalleryFile(null);
        setGalleryPreview("");
        if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
        refreshData();
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to upload photo", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Filmography Upload
  const handleFilmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filmTitle.trim()) {
      showToast("Please enter the film title.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      if (filmFile) fd.append("file", filmFile);
      fd.append("title", filmTitle);
      fd.append("role", filmRole);
      fd.append("lang", filmLang);
      fd.append("year", filmYear);
      fd.append("imdbUrl", filmImdb);
      fd.append("note", filmNote);
      fd.append("highlight", filmHighlight ? "true" : "false");
      fd.append("password", savedPassword);

      const res = await fetch("/api/filmography", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
      } else {
        showToast("Film added successfully to Filmography!");
        setFilmTitle("");
        setFilmImdb("");
        setFilmNote("");
        setFilmHighlight(false);
        setFilmFile(null);
        setFilmPreview("");
        if (filmFileInputRef.current) filmFileInputRef.current.value = "";
        refreshData();
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to add film", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Home Slide Upload
  const handleSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideFile) {
      showToast("Please select an image for the slide.", "error");
      return;
    }
    if (!slideTitle.trim()) {
      showToast("Please enter a slide title.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", slideFile);
      fd.append("title", slideTitle);
      fd.append("subtitle", slideSubtitle);
      fd.append("alt", slideAlt || slideTitle);
      fd.append("password", savedPassword);

      const res = await fetch("/api/home-slides", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
      } else {
        showToast("Featured slide added to Home Carousel!");
        setSlideTitle("");
        setSlideSubtitle("");
        setSlideAlt("");
        setSlideFile(null);
        setSlidePreview("");
        if (slideFileInputRef.current) slideFileInputRef.current.value = "";
        refreshData();
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to upload slide", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Submit Article Upload
  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle.trim()) {
      showToast("Please enter the article title.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      if (articleFile) fd.append("file", articleFile);
      fd.append("title", articleTitle);
      fd.append("publication", articlePublication);
      fd.append("date", articleDate);
      fd.append("summary", articleSummary);
      fd.append("category", articleCategory);
      fd.append("link", articleLink);
      fd.append("password", savedPassword);

      const res = await fetch("/api/articles", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
      } else {
        showToast("Article published successfully!");
        setArticleTitle("");
        setArticlePublication("");
        setArticleSummary("");
        setArticleLink("");
        setArticleFile(null);
        setArticlePreview("");
        if (articleFileInputRef.current) articleFileInputRef.current.value = "";
        refreshData();
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to add article", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handlers
  const handleDeleteGalleryItem = async (item: any) => {
    if (!confirm(`Are you sure you want to delete "${item.name}" from Gallery?`)) return;
    try {
      const res = await fetch("/api/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, src: item.src, name: item.name, password: savedPassword }),
      });
      if (res.ok) {
        showToast(`Removed "${item.name}" from Gallery`);
        refreshData();
      } else {
        showToast("Failed to delete item", "error");
      }
    } catch {
      showToast("Delete request failed", "error");
    }
  };

  const handleDeleteFilm = async (film: any) => {
    if (!confirm(`Are you sure you want to delete film "${film.title}"?`)) return;
    try {
      const res = await fetch("/api/filmography", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: film.id, title: film.title, poster: film.poster, password: savedPassword }),
      });
      if (res.ok) {
        showToast(`Removed "${film.title}" from Filmography`);
        refreshData();
      } else {
        showToast("Failed to delete film", "error");
      }
    } catch {
      showToast("Delete request failed", "error");
    }
  };

  const handleDeleteSlide = async (slide: any) => {
    if (!confirm(`Are you sure you want to delete slide "${slide.title}"?`)) return;
    try {
      const res = await fetch("/api/home-slides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slide.id, src: slide.src, title: slide.title, password: savedPassword }),
      });
      if (res.ok) {
        showToast(`Removed slide "${slide.title}"`);
        refreshData();
      } else {
        showToast("Failed to delete slide", "error");
      }
    } catch {
      showToast("Delete request failed", "error");
    }
  };

  const handleDeleteArticle = async (article: any) => {
    if (!confirm(`Are you sure you want to delete article "${article.title}"?`)) return;
    try {
      const res = await fetch("/api/articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, password: savedPassword }),
      });
      if (res.ok) {
        showToast(`Removed article "${article.title}"`);
        refreshData();
      } else {
        showToast("Failed to delete article", "error");
      }
    } catch {
      showToast("Delete request failed", "error");
    }
  };

  // ══════════════════════════════════════════════════════════
  // RENDER: PASSWORD PROTECTION SCREEN
  // ══════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Cinematic Background Glows */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-sky-500/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 backdrop-blur-xl rounded-3xl p-7 sm:p-8 shadow-2xl relative z-10 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-[#0284C7] p-0.5 mx-auto shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl">
                🛡️
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              Prakash Nathan Admin
            </h1>
            <p className="font-accent text-xs text-slate-400">
              Two-Factor Authentication with Microsoft Authenticator
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-accent text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                autoFocus
              />
            </div>

            {/* 6-Digit Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-accent font-semibold uppercase tracking-wider text-slate-300">
                  Authenticator 6-Digit Code
                </label>
                <span className="text-[0.68rem] font-accent text-blue-400">From Phone App</span>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                value={mfaCodeInput}
                onChange={(e) => setMfaCodeInput(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • • • •"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-600 font-mono text-center text-xl tracking-[0.4em] font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-accent leading-relaxed">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white font-accent font-semibold text-sm tracking-wide shadow-lg shadow-blue-600/30 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isVerifying ? <span>Verifying credentials...</span> : <span>Verify &amp; Unlock Portal →</span>}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 no-underline transition-colors">
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // RENDER: AUTHENTICATED DASHBOARD
  // ══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl font-accent text-sm font-semibold flex items-center gap-3 transition-all animate-bounce ${
            toast.type === "success"
              ? "bg-slate-900 text-white border border-slate-700"
              : "bg-rose-600 text-white border border-rose-700"
          }`}
        >
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1D4ED8] to-[#0284C7] flex items-center justify-center text-white font-display font-bold text-xs">
              PN
            </div>
            <div>
              <div className="font-display font-bold text-sm sm:text-base leading-tight">
                Prakash Nathan <span className="text-[#1D4ED8]">Admin</span>
              </div>
              <div className="text-[0.68rem] font-accent text-slate-500">Direct Content &amp; Media Manager</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/gallery"
                target="_blank"
                className="px-3 py-1.5 rounded-lg text-xs font-accent text-slate-600 hover:text-[#1D4ED8] hover:bg-blue-50/80 transition-colors no-underline flex items-center gap-1 border border-slate-200"
              >
                <span>Gallery</span> <span>↗</span>
              </Link>
              <Link
                href="/filmography"
                target="_blank"
                className="px-3 py-1.5 rounded-lg text-xs font-accent text-slate-600 hover:text-[#1D4ED8] hover:bg-blue-50/80 transition-colors no-underline flex items-center gap-1 border border-slate-200"
              >
                <span>Filmography</span> <span>↗</span>
              </Link>
              <Link
                href="/"
                target="_blank"
                className="px-3 py-1.5 rounded-lg text-xs font-accent text-slate-600 hover:text-[#1D4ED8] hover:bg-blue-50/80 transition-colors no-underline flex items-center gap-1 border border-slate-200"
              >
                <span>Home</span> <span>↗</span>
              </Link>
              <Link
                href="/articles"
                target="_blank"
                className="px-3 py-1.5 rounded-lg text-xs font-accent text-slate-600 hover:text-[#1D4ED8] hover:bg-blue-50/80 transition-colors no-underline flex items-center gap-1 border border-slate-200"
              >
                <span>Articles</span> <span>↗</span>
              </Link>
            </div>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-accent font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-5 py-2.5 rounded-t-xl font-accent text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "gallery"
                ? "border-[#1D4ED8] text-[#1D4ED8] bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-[#0F172A] hover:bg-slate-100"
            }`}
          >
            <span>📸 Gallery Photos</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-[0.68rem] font-bold text-slate-700">
              {galleryItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("filmography")}
            className={`px-5 py-2.5 rounded-t-xl font-accent text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "filmography"
                ? "border-[#1D4ED8] text-[#1D4ED8] bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-[#0F172A] hover:bg-slate-100"
            }`}
          >
            <span>🎬 Filmography</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-[0.68rem] font-bold text-slate-700">
              {filmItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("slides")}
            className={`px-5 py-2.5 rounded-t-xl font-accent text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "slides"
                ? "border-[#1D4ED8] text-[#1D4ED8] bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-[#0F172A] hover:bg-slate-100"
            }`}
          >
            <span>🌟 Home Carousel Slides</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-[0.68rem] font-bold text-slate-700">
              {slideItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("articles")}
            className={`px-5 py-2.5 rounded-t-xl font-accent text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "articles"
                ? "border-[#1D4ED8] text-[#1D4ED8] bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-[#0F172A] hover:bg-slate-100"
            }`}
          >
            <span>📰 Press &amp; Articles</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-[0.68rem] font-bold text-slate-700">
              {articleItems.length}
            </span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB 1: GALLERY MANAGER
        ══════════════════════════════════════════════════════ */}
        {activeTab === "gallery" && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Upload Form Card */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[0.7rem] font-accent font-bold uppercase tracking-wider text-[#1D4ED8]">
                  New Gallery Upload
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
                  Add Picture &amp; Details
                </h2>
                <p className="font-accent text-xs text-[#64748B]">
                  Select a photo and specify the category. It will instantly show up on the live /gallery page.
                </p>
              </div>

              <form onSubmit={handleGallerySubmit} className="space-y-4">
                {/* File Upload Box */}
                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Image File <span className="text-rose-500">*</span>
                  </label>
                  <div
                    onClick={() => galleryFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/70 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center min-h-[140px]"
                  >
                    {galleryPreview ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden shadow-inner">
                        <Image src={galleryPreview} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-accent font-semibold opacity-0 hover:opacity-100 transition-opacity">
                          Click to Change Picture
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-3xl">🖼️</div>
                        <div className="font-accent text-xs font-semibold text-slate-700">
                          Click to choose a picture
                        </div>
                        <div className="font-accent text-[0.7rem] text-slate-400">
                          PNG, JPG, JPEG, WEBP
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setGalleryFile, setGalleryPreview)}
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Personality / Subject Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={galleryName}
                    onChange={(e) => setGalleryName(e.target.value)}
                    placeholder="e.g. Amitabh Bachchan"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={galleryCategory}
                    onChange={(e) => setGalleryCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                  >
                    <option value="Actors & Stars">Actors &amp; Stars</option>
                    <option value="Directors & Creators">Directors &amp; Creators</option>
                    <option value="Icons & Luminaries">Icons &amp; Luminaries</option>
                    <option value="Industry Events">Industry Events</option>
                  </select>
                </div>

                {/* Note / Caption */}
                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Note / Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={galleryNote}
                    onChange={(e) => setGalleryNote(e.target.value)}
                    placeholder="e.g. Kick Film Event & Interaction"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white font-accent font-semibold text-sm tracking-wide shadow-md shadow-blue-600/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <span>Uploading...</span> : <span>➕ Add to Gallery Directly</span>}
                </button>
              </form>
            </div>

            {/* Existing Items List */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#0F172A]">
                    Existing Gallery Items ({galleryItems.length})
                  </h3>
                  <p className="font-accent text-xs text-[#64748B]">
                    Manage or remove photos from the gallery.
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Search gallery..."
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-accent text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-blue-500 w-full sm:w-48"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {galleryItems
                  .filter(
                    (item) =>
                      item.name?.toLowerCase().includes(gallerySearch.toLowerCase()) ||
                      item.category?.toLowerCase().includes(gallerySearch.toLowerCase()) ||
                      item.note?.toLowerCase().includes(gallerySearch.toLowerCase())
                  )
                  .map((item, idx) => (
                    <div
                      key={item.id || `${item.name}-${idx}`}
                      className="p-3 rounded-2xl border border-slate-200/80 hover:border-blue-300 bg-slate-50/50 flex items-center gap-3 group transition-all"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                        <Image src={item.src} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-xs font-bold text-[#0F172A] truncate">
                          {item.name}
                        </div>
                        <div className="text-[0.68rem] font-accent text-[#1D4ED8] font-semibold truncate">
                          {item.category}
                        </div>
                        {item.note && (
                          <div className="text-[0.65rem] font-accent text-slate-500 truncate">
                            {item.note}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteGalleryItem(item)}
                        title="Delete photo"
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-accent font-semibold transition-colors cursor-pointer border border-rose-200 flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 2: FILMOGRAPHY MANAGER
        ══════════════════════════════════════════════════════ */}
        {activeTab === "filmography" && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Upload Film Card */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[0.7rem] font-accent font-bold uppercase tracking-wider text-[#1D4ED8]">
                  New Filmography Entry
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
                  Add Movie / Project
                </h2>
                <p className="font-accent text-xs text-[#64748B]">
                  Upload poster, assign language and credits. Instantly visible on /filmography.
                </p>
              </div>

              <form onSubmit={handleFilmSubmit} className="space-y-4">
                {/* Poster File */}
                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Poster Image
                  </label>
                  <div
                    onClick={() => filmFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/70 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center min-h-[140px]"
                  >
                    {filmPreview ? (
                      <div className="relative w-28 h-36 rounded-xl overflow-hidden shadow-inner">
                        <Image src={filmPreview} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-accent font-semibold opacity-0 hover:opacity-100 transition-opacity">
                          Change
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-3xl">🎬</div>
                        <div className="font-accent text-xs font-semibold text-slate-700">
                          Upload Film Poster
                        </div>
                        <div className="font-accent text-[0.7rem] text-slate-400">JPG, PNG, WEBP</div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={filmFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setFilmFile, setFilmPreview)}
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Film Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={filmTitle}
                    onChange={(e) => setFilmTitle(e.target.value)}
                    placeholder="e.g. Jawan, Stree 2"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {/* Role / Credit */}
                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Role / Credit
                  </label>
                  <input
                    type="text"
                    value={filmRole}
                    onChange={(e) => setFilmRole(e.target.value)}
                    placeholder="e.g. Marketing, Distribution & Syndication"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Language */}
                  <div>
                    <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Language
                    </label>
                    <select
                      value={filmLang}
                      onChange={(e) => setFilmLang(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                    >
                      <option value="Hindi">Hindi</option>
                      <option value="English">English</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Malayalam">Malayalam</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Punjabi">Punjabi</option>
                      <option value="Multi-Language">Multi-Language</option>
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Release Year
                    </label>
                    <input
                      type="text"
                      value={filmYear}
                      onChange={(e) => setFilmYear(e.target.value)}
                      placeholder="2024"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                {/* IMDb URL */}
                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    IMDb Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={filmImdb}
                    onChange={(e) => setFilmImdb(e.target.value)}
                    placeholder="https://www.imdb.com/title/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                {/* Highlight Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="highlightCheck"
                    checked={filmHighlight}
                    onChange={(e) => setFilmHighlight(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="highlightCheck" className="text-xs font-accent font-semibold text-slate-700 cursor-pointer">
                    Mark as Featured Highlight
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white font-accent font-semibold text-sm tracking-wide shadow-md shadow-blue-600/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <span>Saving...</span> : <span>➕ Add Film to Filmography</span>}
                </button>
              </form>
            </div>

            {/* Existing Films List */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#0F172A]">
                    Existing Films ({filmItems.length})
                  </h3>
                  <p className="font-accent text-xs text-[#64748B]">
                    Search or delete titles from the filmography catalog.
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Search title, year, role..."
                  value={filmSearch}
                  onChange={(e) => setFilmSearch(e.target.value)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-accent text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-blue-500 w-full sm:w-56"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {filmItems
                  .filter(
                    (f) =>
                      f.title?.toLowerCase().includes(filmSearch.toLowerCase()) ||
                      f.lang?.toLowerCase().includes(filmSearch.toLowerCase()) ||
                      f.year?.includes(filmSearch) ||
                      f.role?.toLowerCase().includes(filmSearch.toLowerCase())
                  )
                  .map((film, idx) => (
                    <div
                      key={film.id || `${film.title}-${idx}`}
                      className="p-3 rounded-2xl border border-slate-200/80 hover:border-blue-300 bg-slate-50/50 flex items-center gap-3 group transition-all"
                    >
                      <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                        {film.poster ? (
                          <Image src={film.poster} alt={film.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            🎬
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-xs font-bold text-[#0F172A] truncate">
                          {film.title} {film.year && `(${film.year})`}
                        </div>
                        <div className="text-[0.68rem] font-accent text-[#1D4ED8] font-semibold truncate">
                          {film.lang} · {film.role}
                        </div>
                        {film.highlight && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[0.6rem] font-bold">
                            ★ Featured
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteFilm(film)}
                        title="Delete film"
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-accent font-semibold transition-colors cursor-pointer border border-rose-200 flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 3: HOME CAROUSEL SLIDES
        ══════════════════════════════════════════════════════ */}
        {activeTab === "slides" && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[0.7rem] font-accent font-bold uppercase tracking-wider text-[#1D4ED8]">
                  Featured Home Coverflow
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
                  Add Featured Carousel Slide
                </h2>
                <p className="font-accent text-xs text-[#64748B]">
                  Upload high-impact moments that rotate on the home page Coverflow carousel.
                </p>
              </div>

              <form onSubmit={handleSlideSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Slide Photo <span className="text-rose-500">*</span>
                  </label>
                  <div
                    onClick={() => slideFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/70 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center min-h-[140px]"
                  >
                    {slidePreview ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden shadow-inner">
                        <Image src={slidePreview} alt="Preview" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-3xl">🌟</div>
                        <div className="font-accent text-xs font-semibold text-slate-700">Choose Slide Photo</div>
                        <div className="font-accent text-[0.7rem] text-slate-400">PNG, JPG, WEBP</div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={slideFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setSlideFile, setSlidePreview)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Slide Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slideTitle}
                    onChange={(e) => setSlideTitle(e.target.value)}
                    placeholder="e.g. Aamir Khan & Prakash Nathan"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={slideSubtitle}
                    onChange={(e) => setSlideSubtitle(e.target.value)}
                    placeholder="e.g. Global Cinema & Studio Partnerships"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white font-accent font-semibold text-sm tracking-wide shadow-md shadow-blue-600/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <span>Saving...</span> : <span>➕ Add Slide to Home Page</span>}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <h3 className="font-display text-xl font-bold text-[#0F172A]">
                Current Carousel Slides ({slideItems.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                {slideItems.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center gap-3"
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                      <Image src={slide.src} alt={slide.title} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-xs font-bold text-[#0F172A] truncate">
                        {slide.title}
                      </div>
                      <div className="text-[0.68rem] font-accent text-[#1D4ED8] font-semibold truncate">
                        {slide.subtitle}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSlide(slide)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-accent font-semibold transition-colors cursor-pointer border border-rose-200 flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 4: ARTICLES & PRESS
        ══════════════════════════════════════════════════════ */}
        {activeTab === "articles" && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[0.7rem] font-accent font-bold uppercase tracking-wider text-[#1D4ED8]">
                  Press &amp; Publications
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
                  Add News / Article Feature
                </h2>
                <p className="font-accent text-xs text-[#64748B]">
                  Add thought leadership articles, keynote features, or media press mentions.
                </p>
              </div>

              <form onSubmit={handleArticleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Article Thumbnail Image
                  </label>
                  <div
                    onClick={() => articleFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/70 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center min-h-[120px]"
                  >
                    {articlePreview ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden shadow-inner">
                        <Image src={articlePreview} alt="Preview" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-3xl">📰</div>
                        <div className="font-accent text-xs font-semibold text-slate-700">Choose Article Image</div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={articleFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setArticleFile, setArticlePreview)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Article Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    placeholder="e.g. Navigating Indian Cinema Theatrical Windows"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Publication / Media
                    </label>
                    <input
                      type="text"
                      value={articlePublication}
                      onChange={(e) => setArticlePublication(e.target.value)}
                      placeholder="e.g. Economic Times"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Date / Year
                    </label>
                    <input
                      type="text"
                      value={articleDate}
                      onChange={(e) => setArticleDate(e.target.value)}
                      placeholder="2024"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Summary / Excerpt
                  </label>
                  <textarea
                    rows={3}
                    value={articleSummary}
                    onChange={(e) => setArticleSummary(e.target.value)}
                    placeholder="Short summary of the article..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-accent font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    External Link URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={articleLink}
                    onChange={(e) => setArticleLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-accent text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white font-accent font-semibold text-sm tracking-wide shadow-md shadow-blue-600/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <span>Publishing...</span> : <span>➕ Publish Article</span>}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <h3 className="font-display text-xl font-bold text-[#0F172A]">
                Published Articles ({articleItems.length})
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {articleItems.map((article) => (
                  <div
                    key={article.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-4"
                  >
                    {article.image && (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                        <Image src={article.image} alt={article.title} fill className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-accent">
                        <span className="font-bold text-[#1D4ED8]">{article.publication}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{article.date}</span>
                      </div>
                      <div className="font-display text-sm font-bold text-[#0F172A]">
                        {article.title}
                      </div>
                      <div className="text-xs font-accent text-slate-600 line-clamp-2">
                        {article.summary}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteArticle(article)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-accent font-semibold transition-colors cursor-pointer border border-rose-200 flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

