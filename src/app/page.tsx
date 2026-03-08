"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { MoodboardImage, ROOM_TYPES, STYLES } from "@/lib/types";

interface EnrichedMoodboardImage extends MoodboardImage {
  roomType: string;
  style: string;
}

type ViewMode = "all" | "by-room";

export default function Home() {
  const [images, setImages] = useState<EnrichedMoodboardImage[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [filterRoom, setFilterRoom] = useState<string>("All");
  const [filterStyle, setFilterStyle] = useState<string>("All");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addUrlRoom, setAddUrlRoom] = useState("Uncategorised");
  const [addUrlStyle, setAddUrlStyle] = useState("Uncategorised");
  const [addUrlStatus, setAddUrlStatus] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const loadMoodboard = useCallback(async () => {
    const res = await fetch("/api/moodboard");
    const data: EnrichedMoodboardImage[] = await res.json();
    setImages(data);
  }, []);

  useEffect(() => {
    loadMoodboard();
  }, [loadMoodboard]);

  const roomGroups = useMemo(() => {
    const groups: Record<string, EnrichedMoodboardImage[]> = {};
    images.forEach((img) => {
      const room = img.roomType || "Uncategorised";
      if (!groups[room]) groups[room] = [];
      groups[room].push(img);
    });
    return Object.entries(groups).sort(([, a], [, b]) => b.length - a.length);
  }, [images]);

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

  const flatImages = viewMode === "all" ? filteredImages : roomGroups.flatMap(([, imgs]) => imgs);

  // Track which room section is in view for by-room mode
  useEffect(() => {
    if (viewMode !== "by-room") return;
    const observers: IntersectionObserver[] = [];
    sectionRefs.current.forEach((el, room) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveRoom(room);
        },
        { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, [viewMode, roomGroups]);

  function scrollToRoom(room: string) {
    const el = sectionRefs.current.get(room);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  async function handleAddUrl() {
    if (!addUrl.trim()) return;
    setAddingUrl(true);
    setAddUrlStatus("");
    try {
      const res = await fetch("/api/add-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: addUrl.trim(),
          roomType: addUrlRoom,
          style: addUrlStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddUrlStatus(data.error || "Failed to add");
      } else {
        // Auto-add to moodboard
        await fetch("/api/moodboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crawledImageId: data.id,
            imageUrl: data.imageUrl,
          }),
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
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, comment } : img))
    );
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

  // Keyboard for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i !== null ? Math.min(i + 1, flatImages.length - 1) : null));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i !== null ? Math.max(i - 1, 0) : null));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, flatImages.length]);

  const lightboxImage = lightboxIndex !== null ? flatImages[lightboxIndex] : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{
          background: "rgba(250, 250, 247, 0.9)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <h1
              className="text-2xl tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Moodcraft
            </h1>
            {images.length > 0 && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {images.length} saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {images.length > 0 && (
              <div
                className="flex rounded-lg overflow-hidden mr-2"
                style={{ border: "1px solid var(--border-light)" }}
              >
                <button
                  onClick={() => { setViewMode("all"); setFilterRoom("All"); setFilterStyle("All"); }}
                  className="px-3 py-1.5 text-xs font-medium cursor-pointer transition-all"
                  style={{
                    background: viewMode === "all" ? "var(--text-primary)" : "var(--bg-card)",
                    color: viewMode === "all" ? "var(--bg-primary)" : "var(--text-secondary)",
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setViewMode("by-room")}
                  className="px-3 py-1.5 text-xs font-medium cursor-pointer transition-all"
                  style={{
                    background: viewMode === "by-room" ? "var(--text-primary)" : "var(--bg-card)",
                    color: viewMode === "by-room" ? "var(--bg-primary)" : "var(--text-secondary)",
                    borderLeft: "1px solid var(--border-light)",
                  }}
                >
                  By Room
                </button>
              </div>
            )}
            <Link
              href="/browse"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{
                background: "var(--text-primary)",
                color: "var(--bg-primary)",
              }}
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
          style={{
            top: "49px",
            background: "rgba(250, 250, 247, 0.85)",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <div
            className="max-w-[1800px] mx-auto px-6 py-2.5 flex items-center gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {viewMode === "by-room" ? (
              /* Room jump nav for by-room view */
              roomGroups.map(([room, roomImages]) => (
                <button
                  key={room}
                  onClick={() => scrollToRoom(room)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
                  style={{
                    background: activeRoom === room ? "var(--accent-sage)" : "var(--bg-card)",
                    color: activeRoom === room ? "white" : "var(--text-secondary)",
                    border: `1px solid ${activeRoom === room ? "var(--accent-sage)" : "var(--border-light)"}`,
                  }}
                >
                  {room}
                  <span className="ml-1.5 opacity-70">{roomImages.length}</span>
                </button>
              ))
            ) : (
              /* Room + style filters for all view */
              <>
                <span
                  className="shrink-0 text-xs uppercase tracking-wider mr-1"
                  style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}
                >
                  Room
                </span>
                <button
                  onClick={() => setFilterRoom("All")}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
                  style={{
                    background: filterRoom === "All" ? "var(--text-primary)" : "var(--bg-card)",
                    color: filterRoom === "All" ? "var(--bg-primary)" : "var(--text-secondary)",
                    border: `1px solid ${filterRoom === "All" ? "var(--text-primary)" : "var(--border-light)"}`,
                  }}
                >
                  All
                </button>
                {rooms.map((room) => (
                  <button
                    key={room}
                    onClick={() => setFilterRoom(filterRoom === room ? "All" : room)}
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
                    <span
                      className="shrink-0 text-xs uppercase tracking-wider mr-1"
                      style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}
                    >
                      Style
                    </span>
                    <button
                      onClick={() => setFilterStyle("All")}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
                      style={{
                        background: filterStyle === "All" ? "var(--text-primary)" : "var(--bg-card)",
                        color: filterStyle === "All" ? "var(--bg-primary)" : "var(--text-secondary)",
                        border: `1px solid ${filterStyle === "All" ? "var(--text-primary)" : "var(--border-light)"}`,
                      }}
                    >
                      All
                    </button>
                    {styles.map((style) => (
                      <button
                        key={style}
                        onClick={() => setFilterStyle(filterStyle === style ? "All" : style)}
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
              </>
            )}
          </div>
        </nav>
      )}

      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {images.length > 0 ? (
          viewMode === "all" ? (
            filteredImages.length > 0 ? (
              <MasonryGrid
                images={filteredImages}
                onClickImage={(img) => setLightboxIndex(flatImages.indexOf(img))}
                onRemove={handleRemove}
                onCommentChange={handleCommentChange}
              />
            ) : (
              <div className="text-center py-16">
                <p className="text-lg" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>
                  No matches
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  Try adjusting your filters
                </p>
              </div>
            )
          ) : (
            <div className="space-y-12">
              {roomGroups.map(([room, roomImages]) => (
                <section
                  key={room}
                  ref={(el) => { if (el) sectionRefs.current.set(room, el); }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <h2
                      className="text-xl"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {room}
                    </h2>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: "var(--accent-sage-light)",
                        color: "var(--accent-sage)",
                        fontWeight: 500,
                      }}
                    >
                      {roomImages.length}
                    </span>
                  </div>
                  <MasonryGrid
                    images={roomImages}
                    onClickImage={(img) => setLightboxIndex(flatImages.indexOf(img))}
                    onRemove={handleRemove}
                    onCommentChange={handleCommentChange}
                  />
                </section>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-20">
            <p
              className="text-2xl mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}
            >
              Nothing saved yet
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Go{" "}
              <Link
                href="/browse"
                className="underline"
                style={{ color: "var(--accent-sage)" }}
              >
                browse & crawl
              </Link>{" "}
              to start curating your inspiration
            </p>
          </div>
        )}
      </main>

      {/* FAB + Add URL modal */}
      <button
        onClick={() => setShowAddUrl(!showAddUrl)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 shadow-lg"
        style={{
          background: showAddUrl ? "var(--accent-terracotta)" : "var(--accent-sage)",
          color: "white",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: showAddUrl ? "rotate(45deg)" : "none",
            transition: "transform 0.2s ease",
          }}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showAddUrl && (
        <div
          className="fixed bottom-24 right-6 z-40 w-[380px] rounded-2xl p-5 shadow-2xl"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            animation: "fabPanelIn 0.2s ease-out",
          }}
        >
          <h3
            className="text-base mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Add image
          </h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={addUrl}
              onChange={(e) => { setAddUrl(e.target.value); setAddUrlStatus(""); }}
              placeholder="Image URL or page URL"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-light)",
                color: "var(--text-primary)",
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddUrl(); }}
              autoFocus
            />
            <div className="flex gap-2">
              <select
                value={addUrlRoom}
                onChange={(e) => setAddUrlRoom(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none cursor-pointer"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-light)",
                  color: addUrlRoom === "Uncategorised" ? "var(--text-muted)" : "var(--text-primary)",
                }}
              >
                <option value="Uncategorised">Room type</option>
                {ROOM_TYPES.map((room) => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
              <select
                value={addUrlStyle}
                onChange={(e) => setAddUrlStyle(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none cursor-pointer"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-light)",
                  color: addUrlStyle === "Uncategorised" ? "var(--text-muted)" : "var(--text-primary)",
                }}
              >
                <option value="Uncategorised">Style</option>
                {STYLES.map((style) => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddUrl}
              disabled={addingUrl || !addUrl.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: "var(--accent-sage)",
                color: "white",
              }}
            >
              {addingUrl ? "Adding..." : "Add to Moodboard"}
            </button>
            {addUrlStatus && (
              <p
                className="text-sm text-center"
                style={{
                  color: addUrlStatus === "Added!" ? "var(--accent-sage)" : "var(--accent-red)",
                }}
              >
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
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
            onClick={() => setLightboxIndex(null)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>

          {lightboxIndex! > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i! - 1); }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}

          {lightboxIndex! < flatImages.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i! + 1); }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}

          <div
            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={lightboxImage.id}
              src={lightboxImage.imageUrl}
              alt="Moodboard image"
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
              style={{ animation: "lightboxIn 0.2s ease-out" }}
              referrerPolicy="no-referrer"
            />
            <div className="mt-4 text-center">
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {lightboxImage.roomType} &middot; {lightboxImage.style}
              </span>
              {lightboxImage.comment && (
                <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                  &ldquo;{lightboxImage.comment}&rdquo;
                </p>
              )}
              <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {lightboxIndex! + 1} / {flatImages.length}
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
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function MasonryGrid({
  images,
  onClickImage,
  onRemove,
  onCommentChange,
}: {
  images: EnrichedMoodboardImage[];
  onClickImage: (img: EnrichedMoodboardImage) => void;
  onRemove: (id: string) => void;
  onCommentChange: (id: string, comment: string) => void;
}) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5" style={{ columnFill: "balance" }}>
      {images.map((img, i) => (
        <div
          key={img.id}
          className="break-inside-avoid mb-5 group"
          style={{ animation: `cardIn 0.3s ease-out ${i * 0.03}s both` }}
        >
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div
              className="relative overflow-hidden cursor-pointer"
              onClick={() => onClickImage(img)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.imageUrl}
                alt="Saved interior design"
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              {/* Hover overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end"
                style={{
                  background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
                }}
              >
                <div className="p-4 w-full">
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    {img.roomType} &middot; {img.style}
                  </span>
                </div>
              </div>
              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  color: "white",
                  backdropFilter: "blur(4px)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            {/* Comment */}
            <div className="px-3.5 py-3">
              <textarea
                value={img.comment || ""}
                onChange={(e) => onCommentChange(img.id, e.target.value)}
                placeholder="Add a note..."
                className="w-full text-sm rounded-lg p-2.5 resize-none focus:outline-none transition-colors placeholder:italic"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-primary)",
                }}
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
      ))}
    </div>
  );
}
