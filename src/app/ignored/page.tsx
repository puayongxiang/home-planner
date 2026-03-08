"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { CrawledImage, ROOM_TYPES, STYLES } from "@/lib/types";

export default function IgnoredPage() {
  const [ignoredImages, setIgnoredImages] = useState<CrawledImage[]>([]);
  const [filterRoom, setFilterRoom] = useState<string>("All");
  const [filterStyle, setFilterStyle] = useState<string>("All");
  const [focusIndex, setFocusIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  const loadIgnored = useCallback(async () => {
    const [crawlRes, ignoreRes] = await Promise.all([
      fetch("/api/crawl"),
      fetch("/api/ignore"),
    ]);
    const crawled: CrawledImage[] = await crawlRes.json();
    const ignoredIds: string[] = await ignoreRes.json();
    const ignoredSet = new Set(ignoredIds);
    setIgnoredImages(crawled.filter((img) => ignoredSet.has(img.id)));
  }, []);

  useEffect(() => {
    loadIgnored();
  }, [loadIgnored]);

  const filteredImages = ignoredImages
    .filter((img) => filterRoom === "All" || img.roomType === filterRoom)
    .filter((img) => filterStyle === "All" || img.style === filterStyle);

  const roomCounts = ignoredImages.reduce<Record<string, number>>(
    (acc, img) => {
      acc[img.roomType] = (acc[img.roomType] || 0) + 1;
      return acc;
    },
    {}
  );

  const styleCounts = ignoredImages.reduce<Record<string, number>>(
    (acc, img) => {
      acc[img.style] = (acc[img.style] || 0) + 1;
      return acc;
    },
    {}
  );

  const currentImage = filteredImages[focusIndex] || null;

  useEffect(() => {
    setFocusIndex(0);
  }, [filterRoom, filterStyle]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (!currentImage) return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((i) => Math.min(i + 1, filteredImages.length - 1));
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((i) => Math.max(i - 1, 0));
          break;
        case "a":
        case "A":
          e.preventDefault();
          handleRestore(currentImage.id);
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImage, filteredImages.length]);

  useEffect(() => {
    if (!stripRef.current) return;
    const thumb = stripRef.current.children[focusIndex] as HTMLElement;
    if (thumb) {
      thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [focusIndex]);

  async function handleRestore(id: string) {
    await fetch("/api/ignore", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setIgnoredImages((prev) => prev.filter((img) => img.id !== id));
    setFocusIndex((i) => Math.min(i, filteredImages.length - 2));
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{
          background: "rgba(250, 250, 247, 0.9)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/browse"
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              Browse
            </Link>
            <h1
              className="text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ignored
            </h1>
            {ignoredImages.length > 0 && (
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--accent-red-light)",
                  color: "var(--accent-red)",
                  fontWeight: 500,
                }}
              >
                {ignoredImages.length} ignored
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6">
        {/* Filter Tabs */}
        {ignoredImages.length > 0 && (
          <div className="py-4 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="text-xs uppercase tracking-wider mr-2"
                style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}
              >
                Room
              </span>
              <FilterPill
                label={`All (${ignoredImages.length})`}
                active={filterRoom === "All"}
                onClick={() => setFilterRoom("All")}
              />
              {Object.entries(roomCounts).map(([room, count]) => (
                <FilterPill
                  key={room}
                  label={`${room} (${count})`}
                  active={filterRoom === room}
                  onClick={() => setFilterRoom(room)}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="text-xs uppercase tracking-wider mr-2"
                style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}
              >
                Style
              </span>
              <FilterPill
                label={`All (${ignoredImages.length})`}
                active={filterStyle === "All"}
                onClick={() => setFilterStyle("All")}
              />
              {Object.entries(styleCounts).map(([style, count]) => (
                <FilterPill
                  key={style}
                  label={`${style} (${count})`}
                  active={filterStyle === style}
                  onClick={() => setFilterStyle(style)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Spotlight View */}
        {filteredImages.length > 0 ? (
          <div className="pb-8">
            <div className="relative mb-4">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: "var(--bg-secondary)",
                  aspectRatio: "16 / 10",
                  maxHeight: "70vh",
                }}
              >
                {currentImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={currentImage.id}
                    src={currentImage.imageUrl}
                    alt={currentImage.alt || "Interior design"}
                    className="w-full h-full object-cover"
                    style={{ animation: "fadeIn 0.25s ease-out" }}
                    referrerPolicy="no-referrer"
                  />
                )}

                {currentImage && (
                  <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between"
                    style={{
                      background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
                    }}
                  >
                    <div>
                      <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
                        {currentImage.roomType} &middot; {currentImage.style}
                      </span>
                      <p className="text-white/50 text-xs mt-0.5">
                        {focusIndex + 1} of {filteredImages.length}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {currentImage && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => setFocusIndex((i) => Math.max(i - 1, 0))}
                    disabled={focusIndex === 0}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-secondary)",
                    }}
                    title="Previous"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>

                  <button
                    onClick={() => handleRestore(currentImage.id)}
                    className="h-11 px-6 rounded-full flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                    style={{
                      background: "var(--accent-sage)",
                      color: "white",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                    }}
                    title="Restore (A)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                    Restore
                    <kbd>A</kbd>
                  </button>

                  <button
                    onClick={() =>
                      setFocusIndex((i) =>
                        Math.min(i + 1, filteredImages.length - 1)
                      )
                    }
                    disabled={focusIndex === filteredImages.length - 1}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-secondary)",
                    }}
                    title="Next"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            <div
              className="overflow-x-auto pb-2 -mx-6 px-6"
              style={{ scrollbarWidth: "none" }}
            >
              <div ref={stripRef} className="flex gap-2" style={{ minWidth: "max-content" }}>
                {filteredImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setFocusIndex(i)}
                    className="shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all"
                    style={{
                      width: "80px",
                      height: "60px",
                      opacity: i === focusIndex ? 1 : 0.5,
                      outline:
                        i === focusIndex
                          ? "2px solid var(--accent-sage)"
                          : "2px solid transparent",
                      outlineOffset: "2px",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : ignoredImages.length > 0 ? (
          <div className="text-center py-20">
            <p className="text-lg" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>
              No matches
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Adjust filters to see ignored images.
            </p>
          </div>
        ) : (
          <div className="text-center py-20">
            <p
              className="text-2xl mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}
            >
              Nothing ignored
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Images you skip while browsing will appear here
            </p>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
      style={{
        background: active ? "var(--text-primary)" : "var(--bg-card)",
        color: active ? "var(--bg-primary)" : "var(--text-secondary)",
        border: `1px solid ${active ? "var(--text-primary)" : "var(--border-light)"}`,
      }}
    >
      {label}
    </button>
  );
}
