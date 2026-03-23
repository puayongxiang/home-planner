"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuthSession } from "@/components/useAuthSession";
import {
  CrawledImage,
  MoodboardImage,
  ROOM_TYPES,
  STYLES,
  SOURCES,
} from "@/lib/types";

export default function BrowseClient() {
  const { user, loading: authLoading, isAuthenticated, signInWithGoogle, signOut } = useAuthSession();
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["Japandi"]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([
    ...ROOM_TYPES,
  ]);
  const [scrollCount, setScrollCount] = useState(15);
  const [crawling, setCrawling] = useState(false);
  const [crawledImages, setCrawledImages] = useState<CrawledImage[]>([]);
  const [moodboardMap, setMoodboardMap] = useState<Map<string, string>>(
    new Map()
  );
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const [crawlProgress, setCrawlProgress] = useState<{ room: string; current: number; total: number } | null>(null);
  const [incomingImages, setIncomingImages] = useState<CrawledImage[]>([]);
  const [filterRoom, setFilterRoom] = useState<string>("All");
  const [filterStyle, setFilterStyle] = useState<string>("All");
  const [filterSource, setFilterSource] = useState<string>("All");
  const [focusIndex, setFocusIndex] = useState(0);
  const [showCrawlForm, setShowCrawlForm] = useState(false);
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addUrlRoom, setAddUrlRoom] = useState("Uncategorised");
  const [addUrlStyle, setAddUrlStyle] = useState("Uncategorised");
  const [addUrlStatus, setAddUrlStatus] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [importing, setImporting] = useState(false);
  const [showStackedHomes, setShowStackedHomes] = useState(false);
  const [shStartPage, setShStartPage] = useState<number | "">(1);
  const [shEndPage, setShEndPage] = useState<number | "">(5);
  const [shCrawling, setShCrawling] = useState(false);
  const [shProgress, setShProgress] = useState("");
  const [shStatus, setShStatus] = useState("");
  const [shIncoming, setShIncoming] = useState<CrawledImage[]>([]);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const loadImages = useCallback(async () => {
    const [crawlRes, moodRes, ignoreRes] = await Promise.all([
      fetch("/api/crawl"),
      fetch("/api/moodboard"),
      fetch("/api/ignore"),
    ]);
    const crawled: CrawledImage[] = await crawlRes.json();
    const moods: MoodboardImage[] = await moodRes.json();
    const ignored: string[] = await ignoreRes.json();
    setCrawledImages(crawled);
    setMoodboardMap(new Map(moods.map((m) => [m.crawledImageId, m.id])));
    setIgnoredIds(new Set(ignored));
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const availableImages = crawledImages.filter(
    (img) => !moodboardMap.has(img.id) && !ignoredIds.has(img.id)
  );

  const filteredImages = availableImages
    .filter((img) => filterRoom === "All" || img.roomType === filterRoom)
    .filter((img) => filterStyle === "All" || img.style === filterStyle)
    .filter((img) => filterSource === "All" || (img.source || "Unknown") === filterSource);

  const roomCounts = availableImages.reduce<Record<string, number>>(
    (acc, img) => {
      acc[img.roomType] = (acc[img.roomType] || 0) + 1;
      return acc;
    },
    {}
  );

  const styleCounts = availableImages.reduce<Record<string, number>>(
    (acc, img) => {
      acc[img.style] = (acc[img.style] || 0) + 1;
      return acc;
    },
    {}
  );

  const sourceCounts = availableImages.reduce<Record<string, number>>(
    (acc, img) => {
      const s = img.source || "Unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {}
  );

  const currentImage = filteredImages[focusIndex] || null;

  // Reset focus when filters change
  useEffect(() => {
    setFocusIndex(0);
  }, [filterRoom, filterStyle, filterSource]);

  // Keyboard shortcuts
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
          addToMoodboard(currentImage);
          break;
        case "x":
        case "X":
          e.preventDefault();
          handleIgnore(currentImage.id);
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImage, filteredImages.length]);

  // Scroll thumbnail strip to keep focused item visible
  useEffect(() => {
    if (!stripRef.current) return;
    const thumb = stripRef.current.children[focusIndex] as HTMLElement;
    if (thumb) {
      thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [focusIndex]);

  function toggleItem(
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  }

  async function handleCrawl() {
    if (!isAuthenticated) {
      setStatus("Sign in to crawl new images.");
      return;
    }
    if (selectedRooms.length === 0) return;
    setCrawling(true);
    setCrawlProgress(null);
    setIncomingImages([]);
    setStatus("");

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          styles: selectedStyles,
          roomTypes: selectedRooms,
          scrollCount,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setStatus("Crawl failed: no response stream");
        setCrawling(false);
        return;
      }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const match = line.match(/^data: (.+)$/);
          if (!match) continue;
          const event = JSON.parse(match[1]);

          if (event.type === "progress") {
            setCrawlProgress({ room: event.room, current: event.current, total: event.total });
          } else if (event.type === "room_done") {
            setCrawlProgress({ room: event.room, current: event.current, total: event.total });
            if (event.images?.length > 0) {
              setIncomingImages((prev) => [...prev, ...event.images]);
            }
          } else if (event.type === "done") {
            setStatus(
              `Found ${event.total} images (${event.new} new) across ${event.roomsCrawled} room types`
            );
            setCrawlProgress(null);
            setIncomingImages([]);
            await loadImages();
          } else if (event.type === "error") {
            setStatus(event.error || "Crawl failed");
            setCrawlProgress(null);
            setIncomingImages([]);
          }
        }
      }
    } catch {
      setStatus("Crawl failed. Check console for details.");
      setCrawlProgress(null);
    } finally {
      setCrawling(false);
    }
  }

  async function handleClear() {
    if (!isAuthenticated) {
      setStatus("Sign in to manage the crawl catalog.");
      return;
    }
    if (!confirm("Clear all crawled images and moodboard?")) return;
    const res = await fetch("/api/crawl", { method: "DELETE" });
    if (res.status === 401) {
      setStatus("Sign in to manage the crawl catalog.");
      return;
    }
    setCrawledImages([]);
    setMoodboardMap(new Map());
    setIgnoredIds(new Set());
    setFilterRoom("All");
    setFilterStyle("All");
    setFocusIndex(0);
    setStatus("");
  }

  async function handleIgnore(id: string) {
    setIgnoredIds((prev) => new Set([...prev, id]));
    await fetch("/api/ignore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function addToMoodboard(image: CrawledImage) {
    const res = await fetch("/api/moodboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crawledImageId: image.id,
        imageUrl: image.imageUrl,
      }),
    });
    const entry = await res.json();
    setMoodboardMap((prev) => new Map([...prev, [image.id, entry.id]]));
  }

  async function removeFromMoodboard(crawledImageId: string) {
    const moodboardId = moodboardMap.get(crawledImageId);
    if (!moodboardId) return;
    await fetch("/api/moodboard", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: moodboardId }),
    });
    setMoodboardMap((prev) => {
      const next = new Map(prev);
      next.delete(crawledImageId);
      return next;
    });
  }

  async function handleAddUrl() {
    if (!isAuthenticated) {
      setAddUrlStatus("Sign in to add URLs.");
      return;
    }
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
        if (res.status === 401) {
          setAddUrlStatus("Sign in to add URLs.");
          return;
        }
        setAddUrlStatus(data.error || "Failed to add URL");
      } else {
        setAddUrlStatus("Added!");
        setAddUrl("");
        await loadImages();
      }
    } catch {
      setAddUrlStatus("Failed to add URL");
    } finally {
      setAddingUrl(false);
    }
  }

  async function handleStackedHomesCrawl() {
    if (!isAuthenticated) {
      setShStatus("Sign in to crawl new images.");
      return;
    }
    setShCrawling(true);
    setShProgress("");
    setShStatus("");
    setShIncoming([]);

    try {
      const res = await fetch("/api/crawl-stackedhomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startPage: shStartPage || 1, endPage: shEndPage || 20 }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        setShStatus("Crawl failed: no response stream");
        setShCrawling(false);
        return;
      }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const match = line.match(/^data: (.+)$/);
          if (!match) continue;
          const event = JSON.parse(match[1]);

          if (event.type === "progress") {
            setShProgress(event.message);
          } else if (event.type === "article_done") {
            setShProgress(`Page ${event.page}: "${event.title}" — ${event.found} images (${event.newCount} new)`);
            if (event.images?.length > 0) {
              setShIncoming((prev) => [...prev, ...event.images]);
            }
          } else if (event.type === "done") {
            setShStatus(
              `Done! Found ${event.totalFound} images (${event.totalNew} new) across ${event.pagesCrawled} pages`
            );
            setShProgress("");
            setShIncoming([]);
            await loadImages();
          } else if (event.type === "error") {
            setShStatus(event.error || "Crawl failed");
            setShProgress("");
          }
        }
      }
    } catch {
      setShStatus("Crawl failed. Check console for details.");
      setShProgress("");
    } finally {
      setShCrawling(false);
    }
  }

  async function handleImport() {
    if (!isAuthenticated) {
      setImportStatus("Sign in to import URLs.");
      return;
    }
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportStatus("");
    try {
      const res = await fetch("/api/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setImportStatus("Sign in to import URLs.");
          return;
        }
        setImportStatus(data.error || "Import failed");
      } else {
        setImportStatus(`Imported ${data.added} image${data.added !== 1 ? "s" : ""}${data.skipped > 0 ? ` (${data.skipped} already existed)` : ""}`);
        setImportUrl("");
        await loadImages();
      }
    } catch {
      setImportStatus("Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{
          background: "rgba(250, 250, 247, 0.9)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              Moodboard
            </Link>
            <h1
              className="text-2xl tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Browse
            </h1>
            {crawledImages.length > 0 && (
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--accent-sage-light)",
                  color: "var(--accent-sage)",
                  fontWeight: 500,
                }}
              >
                {availableImages.length} to review
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => { setShowStackedHomes(!showStackedHomes); if (!showStackedHomes) { setShowImport(false); setShowAddUrl(false); setShowCrawlForm(false); } }}
                  className="text-sm cursor-pointer transition-colors"
                  style={{
                    color: showStackedHomes ? "var(--accent-terracotta)" : "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {showStackedHomes ? "Close" : "StackedHomes"}
                </button>
                <button
                  onClick={() => { setShowImport(!showImport); if (!showImport) { setShowAddUrl(false); setShowCrawlForm(false); setShowStackedHomes(false); } }}
                  className="text-sm cursor-pointer transition-colors"
                  style={{
                    color: showImport ? "var(--accent-terracotta)" : "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {showImport ? "Close" : "Import"}
                </button>
                <button
                  onClick={() => { setShowAddUrl(!showAddUrl); if (!showAddUrl) { setShowCrawlForm(false); setShowImport(false); setShowStackedHomes(false); } }}
                  className="text-sm cursor-pointer transition-colors"
                  style={{
                    color: showAddUrl ? "var(--accent-terracotta)" : "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {showAddUrl ? "Close" : "+ URL"}
                </button>
                <button
                  onClick={() => { setShowCrawlForm(!showCrawlForm); if (!showCrawlForm) { setShowAddUrl(false); setShowImport(false); setShowStackedHomes(false); } }}
                  className="text-sm cursor-pointer transition-colors"
                  style={{
                    color: showCrawlForm ? "var(--accent-terracotta)" : "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {showCrawlForm ? "Close" : "Crawl"}
                </button>
                {crawledImages.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="text-sm cursor-pointer"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Clear
                  </button>
                )}
              </>
            )}
            <Link
              href="/ignored"
              className="text-sm cursor-pointer transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Ignored
              {ignoredIds.size > 0 && (
                <span className="ml-1 opacity-70">({ignoredIds.size})</span>
              )}
            </Link>
            {authLoading ? (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Checking...
              </span>
            ) : user ? (
              <>
                <span className="hidden sm:inline text-sm" style={{ color: "var(--text-muted)" }}>
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-sm cursor-pointer transition-colors"
                  style={{ color: "var(--text-secondary)", fontWeight: 500 }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all"
                style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </header>

      {!isAuthenticated && !authLoading && (
        <div className="max-w-[1400px] mx-auto px-6 pt-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Sign in with Google to add URLs, import pages, or run crawls. Browsing existing images stays open.
          </p>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-6">
        {/* StackedHomes Crawl */}
        {showStackedHomes && (
          <div
            className="my-6 p-6 rounded-2xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              className="text-lg mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Crawl StackedHomes
            </h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Systematically crawl Home Tours articles from StackedHomes. Each listing page has ~12 articles, each with multiple interior photos. There are 20 pages total.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                From page
                <input
                  type="number"
                  value={shStartPage}
                  onChange={(e) => {
                    const v = e.target.value;
                    setShStartPage(v === "" ? "" : Math.max(1, Math.min(20, Number(v))));
                  }}
                  min={1}
                  max={20}
                  className="w-16 px-2 py-1.5 text-sm rounded-lg focus:outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-primary)",
                  }}
                />
              </label>
              <label className="text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                to page
                <input
                  type="number"
                  value={shEndPage}
                  onChange={(e) => {
                    const v = e.target.value;
                    setShEndPage(v === "" ? "" : Math.max(1, Math.min(20, Number(v))));
                  }}
                  placeholder="20"
                  min={1}
                  max={20}
                  className="w-16 px-2 py-1.5 text-sm rounded-lg focus:outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-primary)",
                  }}
                />
              </label>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                (~{((shEndPage || 20) - (shStartPage || 1) + 1) * 12} articles)
              </span>
              <button
                onClick={handleStackedHomesCrawl}
                disabled={shCrawling}
                className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: "var(--accent-sage)",
                  color: "white",
                }}
              >
                {shCrawling ? "Crawling..." : `Crawl pages ${shStartPage || 1}–${shEndPage || 20}`}
              </button>
            </div>
            {shProgress && (
              <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
                {shProgress}
              </p>
            )}
            {shStatus && !shProgress && (
              <p
                className="text-sm mt-3"
                style={{
                  color: shStatus.startsWith("Done") ? "var(--accent-sage)" : "var(--accent-red)",
                }}
              >
                {shStatus}
              </p>
            )}
            {shIncoming.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                  {shIncoming.length} images found so far
                </p>
                <div className="flex flex-wrap gap-2">
                  {shIncoming.slice(-30).map((img) => (
                    <div
                      key={img.id}
                      className="rounded-lg overflow-hidden"
                      style={{
                        width: "72px",
                        height: "54px",
                        animation: "fadeIn 0.3s ease-out",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import from page */}
        {showImport && (
          <div
            className="my-6 p-6 rounded-2xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              className="text-lg mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Import from project page
            </h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Paste a Hometrust, Qanvast, or any project page URL. All images will be scraped and auto-categorised by room type.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={importUrl}
                onChange={(e) => { setImportUrl(e.target.value); setImportStatus(""); }}
                placeholder="https://www.hometrust.sg/interior-designers/.../project/..."
                className="flex-1 px-4 py-2.5 text-sm rounded-lg focus:outline-none"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-light)",
                  color: "var(--text-primary)",
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleImport(); }}
              />
              <button
                onClick={handleImport}
                disabled={importing || !importUrl.trim()}
                className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: "var(--accent-sage)",
                  color: "white",
                }}
              >
                {importing ? "Importing..." : "Import All"}
              </button>
            </div>
            {importStatus && (
              <p
                className="text-sm mt-3"
                style={{
                  color: importStatus.startsWith("Imported") ? "var(--accent-sage)" : "var(--accent-red)",
                }}
              >
                {importStatus}
              </p>
            )}
          </div>
        )}

        {/* Add URL Form */}
        {showAddUrl && (
          <div
            className="my-6 p-6 rounded-2xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              className="text-lg mb-5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Add from URL
            </h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Paste a direct image URL (.jpg, .png, etc.) or any page link to extract its preview image.
            </p>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={addUrl}
                onChange={(e) => { setAddUrl(e.target.value); setAddUrlStatus(""); }}
                placeholder="https://example.com/image.jpg or any page URL"
                className="w-full px-4 py-2.5 text-sm rounded-lg focus:outline-none"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-light)",
                  color: "var(--text-primary)",
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddUrl(); }}
              />
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  Room
                  <select
                    value={addUrlRoom}
                    onChange={(e) => setAddUrlRoom(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg focus:outline-none cursor-pointer"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="Uncategorised">Uncategorised</option>
                    {ROOM_TYPES.map((room) => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  Style
                  <select
                    value={addUrlStyle}
                    onChange={(e) => setAddUrlStyle(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg focus:outline-none cursor-pointer"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="Uncategorised">Uncategorised</option>
                    {STYLES.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={handleAddUrl}
                  disabled={addingUrl || !addUrl.trim()}
                  className="px-6 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: "var(--text-primary)",
                    color: "var(--bg-primary)",
                  }}
                >
                  {addingUrl ? "Adding..." : "Add"}
                </button>
              </div>
              {addUrlStatus && (
                <p
                  className="text-sm"
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

        {/* Crawl Form - Collapsible */}
        {showCrawlForm && (
          <div
            className="my-6 p-6 rounded-2xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-lg"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Crawl from source
              </h2>
            </div>

            {/* Styles */}
            <div className="mb-4">
              <label
                className="text-xs block mb-2 uppercase tracking-wider"
                style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}
              >
                Styles
              </label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() =>
                      toggleItem(selectedStyles, setSelectedStyles, style)
                    }
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
                    style={{
                      background: selectedStyles.includes(style)
                        ? "var(--text-primary)"
                        : "transparent",
                      color: selectedStyles.includes(style)
                        ? "var(--bg-primary)"
                        : "var(--text-secondary)",
                      border: `1px solid ${
                        selectedStyles.includes(style)
                          ? "var(--text-primary)"
                          : "var(--border-medium)"
                      }`,
                    }}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Types */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <label
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}
                >
                  Rooms
                </label>
                <button
                  onClick={() =>
                    setSelectedRooms(
                      selectedRooms.length === ROOM_TYPES.length
                        ? []
                        : [...ROOM_TYPES]
                    )
                  }
                  className="text-xs cursor-pointer"
                  style={{ color: "var(--accent-sage)" }}
                >
                  {selectedRooms.length === ROOM_TYPES.length
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map((room) => (
                  <button
                    key={room}
                    onClick={() =>
                      toggleItem(selectedRooms, setSelectedRooms, room)
                    }
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
                    style={{
                      background: selectedRooms.includes(room)
                        ? "var(--accent-sage)"
                        : "transparent",
                      color: selectedRooms.includes(room)
                        ? "white"
                        : "var(--text-secondary)",
                      border: `1px solid ${
                        selectedRooms.includes(room)
                          ? "var(--accent-sage)"
                          : "var(--border-medium)"
                      }`,
                    }}
                  >
                    {room}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <label
                className="text-sm whitespace-nowrap flex items-center gap-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Depth
                <input
                  type="number"
                  value={scrollCount}
                  onChange={(e) => setScrollCount(Number(e.target.value))}
                  min={1}
                  max={50}
                  className="w-16 px-2 py-1.5 text-sm rounded-lg focus:outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-primary)",
                  }}
                />
              </label>
              <button
                onClick={handleCrawl}
                disabled={crawling || selectedRooms.length === 0}
                className="px-6 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: "var(--text-primary)",
                  color: "var(--bg-primary)",
                }}
              >
                {crawling
                  ? "Crawling..."
                  : `Crawl ${selectedRooms.length} room(s)`}
              </button>
            </div>
            {crawlProgress && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    Crawling {crawlProgress.room}...
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {crawlProgress.current} / {crawlProgress.total}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(crawlProgress.current / crawlProgress.total) * 100}%`,
                      background: "var(--accent-sage)",
                    }}
                  />
                </div>
              </div>
            )}
            {status && !crawlProgress && (
              <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                {status}
              </p>
            )}
            {/* Incoming images during crawl */}
            {incomingImages.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                  {incomingImages.length} images found so far
                </p>
                <div className="flex flex-wrap gap-2">
                  {incomingImages.map((img) => (
                    <div
                      key={img.id}
                      className="rounded-lg overflow-hidden"
                      style={{
                        width: "72px",
                        height: "54px",
                        animation: "fadeIn 0.3s ease-out",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        {crawledImages.length > 0 && (
          <div className="py-4 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="text-xs uppercase tracking-wider mr-2"
                style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}
              >
                Room
              </span>
              <FilterPill
                label={`All (${availableImages.length})`}
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
                label={`All (${availableImages.length})`}
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
            {Object.keys(sourceCounts).length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="text-xs uppercase tracking-wider mr-2"
                  style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}
                >
                  Source
                </span>
                <FilterPill
                  label={`All (${availableImages.length})`}
                  active={filterSource === "All"}
                  onClick={() => setFilterSource("All")}
                />
                {Object.entries(sourceCounts).map(([source, count]) => (
                  <FilterPill
                    key={source}
                    label={`${source} (${count})`}
                    active={filterSource === source}
                    onClick={() => setFilterSource(source)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Spotlight View */}
        {filteredImages.length > 0 ? (
          <div className="pb-8">
            {/* Hero image */}
            <div ref={spotlightRef} className="relative mb-4">
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
                    style={{
                      animation: "fadeIn 0.25s ease-out",
                    }}
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Image info overlay - bottom */}
                {currentImage && (
                  <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between"
                    style={{
                      background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
                    }}
                  >
                    <div>
                      <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
                        {currentImage.source && <>{currentImage.source} &middot; </>}{currentImage.roomType} &middot; {currentImage.style}
                      </span>
                      <p className="text-white/50 text-xs mt-0.5">
                        {focusIndex + 1} of {filteredImages.length}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Room type tagger for uncategorised images */}
              {currentImage && (currentImage.roomType === "Uncategorised" || currentImage.roomType === "") && (
                <div
                  className="mt-3 p-3 rounded-xl flex flex-wrap items-center gap-2"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <span
                    className="text-xs uppercase tracking-wider mr-1"
                    style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}
                  >
                    Tag room
                  </span>
                  {ROOM_TYPES.map((room) => (
                    <button
                      key={room}
                      onClick={async () => {
                        const res = await fetch("/api/crawl", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: currentImage.id, roomType: room }),
                        });
                        if (res.ok) {
                          setCrawledImages((prev) =>
                            prev.map((img) =>
                              img.id === currentImage.id ? { ...img, roomType: room } : img
                            )
                          );
                        }
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105"
                      style={{
                        background: "transparent",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-medium)",
                      }}
                    >
                      {room}
                    </button>
                  ))}
                </div>
              )}

              {/* Action buttons */}
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
                    title="Previous (←)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>

                  <button
                    onClick={() => handleIgnore(currentImage.id)}
                    className="h-11 px-6 rounded-full flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                    style={{
                      background: "var(--accent-red-light)",
                      color: "var(--accent-red)",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                    }}
                    title="Ignore (X)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    Skip
                    <kbd>X</kbd>
                  </button>

                  <button
                    onClick={() => addToMoodboard(currentImage)}
                    className="h-11 px-6 rounded-full flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                    style={{
                      background: "var(--accent-sage)",
                      color: "white",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                    }}
                    title="Add to moodboard (A)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    Keep
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
                    title="Next (→)"
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
        ) : crawledImages.length > 0 ? (
          <div className="text-center py-20">
            <p className="text-lg" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>
              All reviewed
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Every image has been sorted. Crawl more or adjust filters.
            </p>
          </div>
        ) : (
          <div className="text-center py-20">
            <p
              className="text-2xl mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}
            >
              Start curating
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Open the{" "}
              <button
                onClick={() => setShowCrawlForm(true)}
                className="underline cursor-pointer"
                style={{ color: "var(--accent-sage)" }}
              >
                crawl panel
              </button>{" "}
              to fetch interior design images
            </p>
          </div>
        )}
      </main>

      {/* Fade-in animation */}
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
