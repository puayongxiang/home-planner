"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { MoodboardImage, Stroke, DrawTool, ROOM_TYPES, STYLES } from "@/lib/types";
import AnnotationCanvas from "@/components/AnnotationCanvas";

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
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawTool, setDrawTool] = useState<DrawTool>("pen");
  const [drawColor, setDrawColor] = useState("#FF4444");
  const [drawWidth, setDrawWidth] = useState(4);
  const lightboxImageContainerRef = useRef<HTMLDivElement>(null);
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

  const lightboxImage = lightboxIndex !== null ? filteredImages[lightboxIndex] : null;

  // Reset draw mode when switching images
  useEffect(() => {
    setIsDrawMode(false);
  }, [lightboxIndex]);

  // Keyboard for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isDrawMode) { setIsDrawMode(false); return; }
        setLightboxIndex(null);
      }
      if (!isDrawMode) {
        if (e.key === "ArrowRight")
          setLightboxIndex((i) => (i !== null ? Math.min(i + 1, filteredImages.length - 1) : null));
        if (e.key === "ArrowLeft")
          setLightboxIndex((i) => (i !== null ? Math.max(i - 1, 0) : null));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && lightboxImage) {
        e.preventDefault();
        handleAnnotationUndo(lightboxImage.id);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, filteredImages.length, isDrawMode, lightboxImage]);

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

  function handleAnnotationAdd(id: string, stroke: Stroke) {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, annotations: [...(img.annotations || []), stroke] } : img
      )
    );
    // Debounced save
    const key = `ann-${id}`;
    const existing = debounceTimers.current.get(key);
    if (existing) clearTimeout(existing);
    debounceTimers.current.set(
      key,
      setTimeout(async () => {
        const current = images.find((i) => i.id === id);
        const updatedAnnotations = [...(current?.annotations || []), stroke];
        await fetch("/api/moodboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, annotations: updatedAnnotations }),
        });
        debounceTimers.current.delete(key);
      }, 800)
    );
  }

  function handleAnnotationUndo(id: string) {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id || !img.annotations?.length) return img;
        const newAnnotations = img.annotations.slice(0, -1);
        // Save immediately on undo
        fetch("/api/moodboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, annotations: newAnnotations }),
        });
        return { ...img, annotations: newAnnotations };
      })
    );
  }

  function handleAnnotationClear(id: string) {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        fetch("/api/moodboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, annotations: [] }),
        });
        return { ...img, annotations: [] };
      })
    );
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
          <div className="flex items-center gap-2">
            <Link
              href="/furniture"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
            >
              Furniture
            </Link>
            <Link
              href="/browse"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}
            >
              Browse & Crawl
            </Link>
          </div>
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
          onClick={() => { if (!isDrawMode) setLightboxIndex(null); }}
        >
          {/* Close button */}
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 z-10" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          {/* Nav arrows */}
          {!isDrawMode && lightboxIndex! > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i! - 1); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}
          {!isDrawMode && lightboxIndex! < filteredImages.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i! + 1); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}
          <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* Image + canvas overlay */}
            <div ref={lightboxImageContainerRef} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={lightboxImage.id} src={lightboxImage.imageUrl} alt="Moodboard image" className="max-w-full max-h-[65vh] object-contain rounded-lg" style={{ animation: "lightboxIn 0.2s ease-out" }} referrerPolicy="no-referrer" />
              <AnnotationCanvas
                containerRef={lightboxImageContainerRef}
                annotations={lightboxImage.annotations || []}
                isDrawMode={isDrawMode}
                currentColor={drawColor}
                currentWidth={drawWidth}
                currentTool={drawTool}
                onStrokeAdd={(stroke) => handleAnnotationAdd(lightboxImage.id, stroke)}
              />
            </div>

            {/* Drawing toolbar — always visible */}
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
              {/* View mode (cursor) */}
              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                style={{ background: !isDrawMode ? "rgba(255,255,255,0.25)" : "transparent", color: "white" }}
                onClick={() => setIsDrawMode(false)}
                title="View mode (Esc)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" />
                </svg>
              </button>

              {/* Divider */}
              <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.15)" }} />

              {/* Tool buttons */}
              {([
                { tool: "pen" as DrawTool, label: "Pen", icon: <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /> },
                { tool: "highlight" as DrawTool, label: "Highlight", icon: <><path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /></> },
                { tool: "circle" as DrawTool, label: "Circle", icon: <circle cx="12" cy="12" r="10" /> },
                { tool: "rect" as DrawTool, label: "Rectangle", icon: <rect x="3" y="3" width="18" height="18" rx="2" /> },
              ] as const).map(({ tool, label, icon }) => (
                <button
                  key={tool}
                  className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                  style={{ background: isDrawMode && drawTool === tool ? "rgba(255,255,255,0.25)" : "transparent", color: "white" }}
                  onClick={() => { setIsDrawMode(true); setDrawTool(tool); }}
                  title={label}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </button>
              ))}

              {/* Divider */}
              <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.15)" }} />

              {/* Color swatches */}
              {["#FF4444", "#4488FF", "#44CC44", "#FFD700", "#FFFFFF", "#000000"].map((c) => (
                <button
                  key={c}
                  className="w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110"
                  style={{
                    background: c,
                    border: drawColor === c ? "2px solid white" : "2px solid transparent",
                    boxShadow: drawColor === c ? "0 0 0 1.5px rgba(255,255,255,0.4)" : "none",
                    outline: c === "#000000" ? "1px solid rgba(255,255,255,0.3)" : "none",
                  }}
                  onClick={() => setDrawColor(c)}
                />
              ))}

              {/* Divider */}
              <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.15)" }} />

              {/* Stroke widths */}
              {[2, 4, 8].map((w) => (
                <button
                  key={w}
                  className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                  style={{ background: drawWidth === w ? "rgba(255,255,255,0.2)" : "transparent" }}
                  onClick={() => setDrawWidth(w)}
                >
                  <div className="rounded-full" style={{ width: w + 3, height: w + 3, background: "white" }} />
                </button>
              ))}

              {/* Divider */}
              <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.15)" }} />

              {/* Undo */}
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-white/10 disabled:opacity-30"
                style={{ color: "white" }}
                onClick={() => handleAnnotationUndo(lightboxImage.id)}
                disabled={!lightboxImage.annotations?.length}
                title="Undo (Ctrl+Z)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>

              {/* Clear all */}
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-white/10 disabled:opacity-30"
                style={{ color: "white" }}
                onClick={() => handleAnnotationClear(lightboxImage.id)}
                disabled={!lightboxImage.annotations?.length}
                title="Clear all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>

            {/* Info + comment */}
            <div className="mt-3 flex flex-col items-center gap-2 w-full max-w-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {lightboxImage.roomType} &middot; {lightboxImage.style}
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {lightboxIndex! + 1} / {filteredImages.length}
                </span>
              </div>
              <textarea
                value={lightboxImage.comment || ""}
                onChange={(e) => handleCommentChange(lightboxImage.id, e.target.value)}
                placeholder="Add a note..."
                className="w-full text-sm rounded-lg px-4 py-2.5 resize-none focus:outline-none placeholder:italic"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}
                rows={2}
                onClick={(e) => e.stopPropagation()}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = t.scrollHeight + "px";
                }}
              />
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

/* ── Strokes SVG overlay for cards ── */
function StrokesOverlay({ annotations }: { annotations?: Stroke[] }) {
  if (!annotations?.length) return null;
  const S = 1000;
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5] card-image" viewBox={`0 0 ${S} ${S}`} preserveAspectRatio="none">
      {annotations.map((stroke, i) => {
        if (stroke.points.length < 2) return null;
        const tool = stroke.tool || "pen";

        if (tool === "circle") {
          const p0 = stroke.points[0];
          const p1 = stroke.points[stroke.points.length - 1];
          const cx = ((p0.x + p1.x) / 2) * S;
          const cy = ((p0.y + p1.y) / 2) * S;
          const rx = Math.abs(p1.x - p0.x) / 2 * S;
          const ry = Math.abs(p1.y - p0.y) / 2 * S;
          return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={stroke.color} strokeWidth={stroke.width} />;
        }

        if (tool === "rect") {
          const p0 = stroke.points[0];
          const p1 = stroke.points[stroke.points.length - 1];
          const x = Math.min(p0.x, p1.x) * S;
          const y = Math.min(p0.y, p1.y) * S;
          const w = Math.abs(p1.x - p0.x) * S;
          const h = Math.abs(p1.y - p0.y) * S;
          return <rect key={i} x={x} y={y} width={w} height={h} fill="none" stroke={stroke.color} strokeWidth={stroke.width} />;
        }

        // pen or highlight
        const d = stroke.points
          .map((p, j) => `${j === 0 ? "M" : "L"}${p.x * S} ${p.y * S}`)
          .join(" ");
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={stroke.color}
            strokeWidth={tool === "highlight" ? stroke.width * 4 : stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={tool === "highlight" ? 0.35 : 1}
          />
        );
      })}
    </svg>
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
        <StrokesOverlay annotations={img.annotations} />
        {/* Always-visible info at bottom */}
        <div className="absolute inset-x-0 bottom-0 p-5 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)" }}>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ background: roomColor, color: "white" }}>
              {img.roomType}
            </span>
            {img.style && img.style !== "Uncategorised" && (
              <span className="text-xs font-medium px-2.5 py-1.5 rounded-full" style={{ background: styleColor ? `${styleColor}dd` : "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.95)" }}>
                {img.style}
              </span>
            )}
            {img.comment && (
              <span className="ml-auto text-sm max-w-[300px] truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
                &ldquo;{img.comment}&rdquo;
              </span>
            )}
          </div>
        </div>
        {/* Action buttons — appear on hover, don't block image click */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors hover:brightness-110"
            style={{ background: "rgba(212, 170, 60, 0.9)", color: "white" }}
            onClick={(e) => { e.stopPropagation(); onToggleFeatured(img.id); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            Unfeature
          </button>
          <button
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors hover:bg-gray-100"
            onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            Remove
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
          <StrokesOverlay annotations={img.annotations} />
          {/* Room tag — always visible */}
          <span
            className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full pointer-events-none z-10"
            style={{ background: `${roomColor}cc`, color: "white", backdropFilter: "blur(4px)" }}
          >
            {img.roomType}
          </span>
          {/* Annotation indicator */}
          {img.annotations && img.annotations.length > 0 && (
            <span className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center pointer-events-none z-10" style={{ background: "rgba(255, 68, 68, 0.85)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" />
              </svg>
            </span>
          )}
          {/* Style chip — always visible bottom left */}
          {img.style && img.style !== "Uncategorised" && (
            <span
              className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full pointer-events-none z-10"
              style={{ background: styleColor ? `${styleColor}dd` : "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)" }}
            >
              {img.style}
            </span>
          )}
          {/* Action buttons — appear on hover, don't block image click */}
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:brightness-110"
              style={{ background: "rgba(212, 170, 60, 0.9)", color: "white" }}
              onClick={(e) => { e.stopPropagation(); onToggleFeatured(img.id); }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              Feature
            </button>
            <button
              className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:bg-gray-100"
              onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              Remove
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
