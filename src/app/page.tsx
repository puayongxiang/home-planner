"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { MoodboardImage, ROOM_TYPES, STYLES } from "@/lib/types";

interface EnrichedMoodboardImage extends MoodboardImage {
  roomType: string;
  style: string;
}

const STYLE_COLORS: Record<string, string> = {
  Japandi: "#C4775B",
  Scandinavian: "#6B8FAD",
  Minimalistic: "#9E9B91",
  Modern: "#3A3A38",
  "Wabi-Sabi": "#A68B6B",
  Transitional: "#8B7D9E",
  Eclectic: "#C46B8B",
  Colourful: "#D4884E",
  Contemporary: "#5B7D6E",
  Industrial: "#7A7874",
};

const ROOM_COLORS: Record<string, string> = {
  "Living Room": "#7D8B6E",
  Kitchen: "#C4775B",
  Bedroom: "#8B7D9E",
  Bathroom: "#6B8FAD",
  "Dining Room": "#A68B6B",
  Study: "#5B7D6E",
  Garden: "#6B9E6B",
  Balcony: "#D4884E",
};

export default function Home() {
  const [images, setImages] = useState<EnrichedMoodboardImage[]>([]);
  const [filterRoom, setFilterRoom] = useState<string>("All");
  const [filterStyle, setFilterStyle] = useState<string>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addUrlRoom, setAddUrlRoom] = useState("Uncategorised");
  const [addUrlStyle, setAddUrlStyle] = useState("Uncategorised");
  const [addUrlStatus, setAddUrlStatus] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const loadMoodboard = useCallback(async () => {
    const res = await fetch("/api/moodboard");
    const data: EnrichedMoodboardImage[] = await res.json();
    setImages(data);
  }, []);

  useEffect(() => {
    loadMoodboard();
  }, [loadMoodboard]);

  const rooms = useMemo(() => {
    const set = new Set<string>();
    images.forEach((img) => set.add(img.roomType || "Uncategorised"));
    return Array.from(set);
  }, [images]);

  const styles = useMemo(() => {
    const set = new Set<string>();
    images.forEach((img) => set.add(img.style || "Uncategorised"));
    return Array.from(set);
  }, [images]);

  const filteredImages = useMemo(() => {
    return images
      .filter((img) => filterRoom === "All" || img.roomType === filterRoom)
      .filter((img) => filterStyle === "All" || img.style === filterStyle);
  }, [images, filterRoom, filterStyle]);

  const featuredImages = useMemo(() => filteredImages.filter((img) => img.featured), [filteredImages]);
  const gridImages = useMemo(() => filteredImages.filter((img) => !img.featured), [filteredImages]);

  // Keyboard for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i !== null ? Math.min(i + 1, filteredImages.length - 1) : null));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i !== null ? Math.max(i - 1, 0) : null));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, filteredImages.length]);

  const lightboxImage = lightboxIndex !== null ? filteredImages[lightboxIndex] : null;

  async function handleAddUrl() {
    if (!addUrl.trim()) return;
    setAddingUrl(true);
    setAddUrlStatus("");
    try {
      const res = await fetch("/api/add-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: addUrl.trim(), roomType: addUrlRoom, style: addUrlStyle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddUrlStatus(data.error || "Failed to add");
      } else {
        await fetch("/api/moodboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ crawledImageId: data.id, imageUrl: data.imageUrl }),
        });
        setAddUrlStatus("Added!");
        setAddUrl("");
        await loadMoodboard();
      }
    } catch {
      setAddUrlStatus("Failed to add");
    } finally {
      setAddingUrl(false);
    }
  }

  function handleCommentChange(id: string, comment: string) {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, comment } : img)));
    const existing = debounceTimers.current.get(id);
    if (existing) clearTimeout(existing);
    debounceTimers.current.set(
      id,
      setTimeout(async () => {
        await fetch("/api/moodboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, comment }),
        });
        debounceTimers.current.delete(id);
      }, 500)
    );
  }

  async function handleRemove(id: string) {
    await fetch("/api/moodboard", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (lightboxIndex !== null) setLightboxIndex(null);
  }

  async function handleToggleFeatured(id: string) {
    const img = images.find((i) => i.id === id);
    if (!img) return;
    const newFeatured = !img.featured;
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, featured: newFeatured } : i)));
    await fetch("/api/moodboard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, featured: newFeatured }),
    });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ background: "rgba(250, 250, 247, 0.9)", borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Moodcraft
            </h1>
            {images.length > 0 && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {images.length} saved
                {featuredImages.length > 0 && (
                  <span> &middot; {featuredImages.length} featured</span>
                )}
              </span>
            )}
          </div>
          <Link
            href="/browse"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}
          >
            Browse & Crawl
          </Link>
        </div>
      </header>

      {/* Sticky filter bar */}
      {images.length > 0 && (
        <nav
          className="sticky z-20 backdrop-blur-md"
          style={{ top: "49px", background: "rgba(250, 250, 247, 0.85)", borderBottom: "1px solid var(--border-light)" }}
        >
          <div
            className="max-w-[1800px] mx-auto px-6 py-2.5 flex items-center gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <span className="shrink-0 text-xs uppercase tracking-wider mr-1" style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}>
              Room
            </span>
            {["All", ...rooms].map((room) => (
              <button
                key={room}
                onClick={() => setFilterRoom(filterRoom === room && room !== "All" ? "All" : room)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
                style={{
                  background: filterRoom === room ? "var(--text-primary)" : "var(--bg-card)",
                  color: filterRoom === room ? "var(--bg-primary)" : "var(--text-secondary)",
                  border: `1px solid ${filterRoom === room ? "var(--text-primary)" : "var(--border-light)"}`,
                }}
              >
                {room}
              </button>
            ))}
            {styles.length > 1 && (
              <>
                <div className="shrink-0 w-px h-5 mx-1" style={{ background: "var(--border-medium)" }} />
                <span className="shrink-0 text-xs uppercase tracking-wider mr-1" style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}>
                  Style
                </span>
                {["All", ...styles].map((style) => (
                  <button
                    key={style}
                    onClick={() => setFilterStyle(filterStyle === style && style !== "All" ? "All" : style)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
                    style={{
                      background: filterStyle === style ? "var(--text-primary)" : "var(--bg-card)",
                      color: filterStyle === style ? "var(--bg-primary)" : "var(--text-secondary)",
                      border: `1px solid ${filterStyle === style ? "var(--text-primary)" : "var(--border-light)"}`,
                    }}
                  >
                    {style}
                  </button>
                ))}
              </>
            )}
          </div>
        </nav>
      )}

      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {images.length > 0 ? (
          filteredImages.length > 0 ? (
            <div>
              {/* Featured hero section */}
              {featuredImages.length > 0 && (
                <div className={`mb-8 ${featuredImages.length === 1 ? "" : "grid gap-5"}`} style={featuredImages.length > 1 ? { gridTemplateColumns: `repeat(${Math.min(featuredImages.length, 2)}, 1fr)` } : undefined}>
                  {featuredImages.map((img) => (
                    <HeroCard
                      key={img.id}
                      img={img}
                      onClick={() => setLightboxIndex(filteredImages.indexOf(img))}
                      onRemove={handleRemove}
                      onToggleFeatured={handleToggleFeatured}
                    />
                  ))}
                </div>
              )}

              {/* Uniform grid */}
              {gridImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {gridImages.map((img, i) => (
                    <GridCard
                      key={img.id}
                      img={img}
                      index={i}
                      onClick={() => setLightboxIndex(filteredImages.indexOf(img))}
                      onRemove={handleRemove}
                      onCommentChange={handleCommentChange}
                      onToggleFeatured={handleToggleFeatured}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>No matches</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Try adjusting your filters</p>
            </div>
          )
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>
              Nothing saved yet
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Go{" "}
              <Link href="/browse" className="underline" style={{ color: "var(--accent-sage)" }}>
                browse & crawl
              </Link>{" "}
              to start curating your inspiration
            </p>
          </div>
        )}
      </main>

      {/* Playground FAB */}
      <Link
        href="/playground"
        className="fixed bottom-6 right-24 z-40 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-md"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-muted)" }}
        title="Design Playground"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </Link>

      {/* FAB + Add URL modal */}
      <button
        onClick={() => setShowAddUrl(!showAddUrl)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 shadow-lg"
        style={{ background: showAddUrl ? "var(--accent-terracotta)" : "var(--accent-sage)", color: "white" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showAddUrl ? "rotate(45deg)" : "none", transition: "transform 0.2s ease" }}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showAddUrl && (
        <div
          className="fixed bottom-24 right-6 z-40 w-[380px] rounded-2xl p-5 shadow-2xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", animation: "fabPanelIn 0.2s ease-out" }}
        >
          <h3 className="text-base mb-3" style={{ fontFamily: "var(--font-display)" }}>Add image</h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={addUrl}
              onChange={(e) => { setAddUrl(e.target.value); setAddUrlStatus(""); }}
              placeholder="Image URL or page URL"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddUrl(); }}
              autoFocus
            />
            <div className="flex gap-2">
              <select value={addUrlRoom} onChange={(e) => setAddUrlRoom(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none cursor-pointer" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: addUrlRoom === "Uncategorised" ? "var(--text-muted)" : "var(--text-primary)" }}>
                <option value="Uncategorised">Room type</option>
                {ROOM_TYPES.map((room) => (<option key={room} value={room}>{room}</option>))}
              </select>
              <select value={addUrlStyle} onChange={(e) => setAddUrlStyle(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none cursor-pointer" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: addUrlStyle === "Uncategorised" ? "var(--text-muted)" : "var(--text-primary)" }}>
                <option value="Uncategorised">Style</option>
                {STYLES.map((style) => (<option key={style} value={style}>{style}</option>))}
              </select>
            </div>
            <button onClick={handleAddUrl} disabled={addingUrl || !addUrl.trim()} className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" style={{ background: "var(--accent-sage)", color: "white" }}>
              {addingUrl ? "Adding..." : "Add to Moodboard"}
            </button>
            {addUrlStatus && (
              <p className="text-sm text-center" style={{ color: addUrlStatus === "Added!" ? "var(--accent-sage)" : "var(--accent-red)" }}>
                {addUrlStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0, 0, 0, 0.85)" }}
          onClick={() => setLightboxIndex(null)}
        >
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={() => setLightboxIndex(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          {lightboxIndex! > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i! - 1); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}
          {lightboxIndex! < filteredImages.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i! + 1); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}
          <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={lightboxImage.id} src={lightboxImage.imageUrl} alt="Moodboard image" className="max-w-full max-h-[75vh] object-contain rounded-lg" style={{ animation: "lightboxIn 0.2s ease-out" }} referrerPolicy="no-referrer" />
            <div className="mt-4 text-center">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
                {lightboxImage.roomType} &middot; {lightboxImage.style}
              </span>
              {lightboxImage.comment && (
                <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>&ldquo;{lightboxImage.comment}&rdquo;</p>
              )}
              <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {lightboxIndex! + 1} / {filteredImages.length}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fabPanelIn {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lightboxIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .card-enter {
          animation: cardEnter 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .card-image {
          transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
          transform-origin: center center;
        }
        .group:hover .card-image {
          transform: scale(1.06);
        }
      `}</style>
    </div>
  );
}

/* ── Hero Card (featured) ── */
function HeroCard({
  img,
  onClick,
  onRemove,
  onToggleFeatured,
}: {
  img: EnrichedMoodboardImage;
  onClick: () => void;
  onRemove: (id: string) => void;
  onToggleFeatured: (id: string) => void;
}) {
  const roomColor = ROOM_COLORS[img.roomType] || "var(--accent-sage)";
  const styleColor = STYLE_COLORS[img.style] || null;
  return (
    <div className="group card-enter">
      <div
        className="rounded-2xl overflow-hidden relative cursor-pointer transition-all duration-300 hover:shadow-2xl"
        style={{ border: "1px solid var(--border-light)" }}
        onClick={onClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.imageUrl}
          alt="Featured"
          className="w-full object-cover card-image"
          style={{ aspectRatio: "21/9" }}
          referrerPolicy="no-referrer"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
        {/* Bottom info */}
        <div className="absolute bottom-5 left-6 flex items-center gap-2.5">
          <span
            className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{ background: roomColor, color: "white" }}
          >
            {img.roomType}
          </span>
          {img.style && img.style !== "Uncategorised" && (
            <span
              className="text-xs font-medium px-2.5 py-1.5 rounded-full"
              style={{ background: styleColor ? `${styleColor}dd` : "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.95)" }}
            >
              {img.style}
            </span>
          )}
        </div>
        {img.comment && (
          <p className="absolute bottom-5 right-6 text-sm max-w-[300px] truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
            &ldquo;{img.comment}&rdquo;
          </p>
        )}
        {/* Action buttons — top right */}
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-1 group-hover:translate-y-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFeatured(img.id); }}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(212, 170, 60, 0.85)", color: "white", backdropFilter: "blur(4px)" }}
            title="Unfeature"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(0,0,0,0.5)", color: "white", backdropFilter: "blur(4px)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Grid Card ── */
function GridCard({
  img,
  index,
  onClick,
  onRemove,
  onCommentChange,
  onToggleFeatured,
}: {
  img: EnrichedMoodboardImage;
  index: number;
  onClick: () => void;
  onRemove: (id: string) => void;
  onCommentChange: (id: string, comment: string) => void;
  onToggleFeatured: (id: string) => void;
}) {
  const roomColor = ROOM_COLORS[img.roomType] || "var(--accent-sage)";
  const styleColor = STYLE_COLORS[img.style] || null;
  return (
    <div className="group card-enter" style={{ animationDelay: `${index * 0.03}s` }}>
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}
      >
        <div className="relative overflow-hidden cursor-pointer" onClick={onClick}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.imageUrl}
            alt="Saved interior design"
            className="w-full object-cover card-image"
            style={{ aspectRatio: "4/3" }}
            referrerPolicy="no-referrer"
          />
          {/* Room tag — always visible */}
          <span
            className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ background: `${roomColor}cc`, color: "white", backdropFilter: "blur(4px)" }}
          >
            {img.roomType}
          </span>
          {/* Style chip — on hover */}
          {img.style && img.style !== "Uncategorised" && (
            <span
              className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
              style={{ background: styleColor ? `${styleColor}dd` : "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)" }}
            >
              {img.style}
            </span>
          )}
          {/* Action buttons — top right, on hover */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-1 group-hover:translate-y-0">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFeatured(img.id); }}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(0,0,0,0.5)", color: "white", backdropFilter: "blur(4px)" }}
              title="Feature this image"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(0,0,0,0.5)", color: "white", backdropFilter: "blur(4px)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
        {/* Comment */}
        <div className="px-3 py-2.5">
          <textarea
            value={img.comment || ""}
            onChange={(e) => onCommentChange(img.id, e.target.value)}
            placeholder="Add a note..."
            className="w-full text-sm rounded-lg p-2 resize-none focus:outline-none placeholder:italic"
            style={{ background: "transparent", border: "none", color: "var(--text-primary)" }}
            rows={1}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = t.scrollHeight + "px";
            }}
          />
        </div>
      </div>
    </div>
  );
}
