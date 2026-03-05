"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ImageCard from "@/components/ImageCard";
import {
  CrawledImage,
  MoodboardImage,
  ROOM_TYPES,
  STYLES,
} from "@/lib/types";

export default function Home() {
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["Japandi"]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([
    ...ROOM_TYPES,
  ]);
  const [scrollCount, setScrollCount] = useState(15);
  const [crawling, setCrawling] = useState(false);
  const [crawledImages, setCrawledImages] = useState<CrawledImage[]>([]);
  const [moodboardMap, setMoodboardMap] = useState<Map<string, string>>(new Map());
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const [filterRoom, setFilterRoom] = useState<string>("All");
  const [filterStyle, setFilterStyle] = useState<string>("All");

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
    .filter((img) => filterStyle === "All" || img.style === filterStyle);

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
    if (selectedRooms.length === 0) return;
    setCrawling(true);
    setStatus(
      `Crawling ${selectedRooms.length} room type(s)... This may take a few minutes.`
    );

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
      const data = await res.json();

      if (res.ok) {
        setStatus(
          `Done! Found ${data.total} images (${data.new} new) across ${data.roomsCrawled} room types`
        );
        await loadImages();
      } else {
        setStatus(data.error || "Crawl failed");
      }
    } catch {
      setStatus("Crawl failed. Check console for details.");
    } finally {
      setCrawling(false);
    }
  }

  async function handleClear() {
    if (!confirm("Clear all crawled images and moodboard?")) return;
    await fetch("/api/crawl", { method: "DELETE" });
    setCrawledImages([]);
    setMoodboardMap(new Map());
    setIgnoredIds(new Set());
    setFilterRoom("All");
    setFilterStyle("All");
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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 sticky top-0 bg-neutral-950/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Qanvast Moodboard</h1>
          <div className="flex items-center gap-3">
            {crawledImages.length > 0 && (
              <button
                onClick={handleClear}
                className="text-neutral-500 hover:text-red-400 text-sm cursor-pointer"
              >
                Clear all
              </button>
            )}
            <Link
              href="/moodboard"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              View Moodboard ({moodboardMap.size})
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Crawl Form */}
        <div className="mb-8 p-6 rounded-xl bg-neutral-900 border border-neutral-800">
          <h2 className="text-lg font-medium mb-4">Crawl from Qanvast</h2>

          {/* Styles */}
          <div className="mb-4">
            <label className="text-sm text-neutral-400 block mb-2">
              Styles
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() =>
                    toggleItem(selectedStyles, setSelectedStyles, style)
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                    selectedStyles.includes(style)
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Room Types */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm text-neutral-400">Room Types</label>
              <button
                onClick={() =>
                  setSelectedRooms(
                    selectedRooms.length === ROOM_TYPES.length
                      ? []
                      : [...ROOM_TYPES]
                  )
                }
                className="text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer"
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                    selectedRooms.includes(room)
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <label className="text-sm text-neutral-400 whitespace-nowrap">
              Scroll depth:
              <input
                type="number"
                value={scrollCount}
                onChange={(e) => setScrollCount(Number(e.target.value))}
                min={1}
                max={20}
                className="w-16 ml-2 bg-neutral-800 border border-neutral-700 rounded-md px-2 py-2 text-sm focus:outline-none focus:border-neutral-500"
              />
            </label>
            <button
              onClick={handleCrawl}
              disabled={crawling || selectedRooms.length === 0}
              className="bg-white text-black px-6 py-2 rounded-md text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {crawling
                ? "Crawling..."
                : `Crawl ${selectedRooms.length} room(s)`}
            </button>
          </div>
          {status && (
            <p className="mt-3 text-sm text-neutral-400">{status}</p>
          )}
        </div>

        {/* Filter Tabs */}
        {crawledImages.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-neutral-500 self-center mr-1">Room:</span>
              <button
                onClick={() => setFilterRoom("All")}
                className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                  filterRoom === "All"
                    ? "bg-neutral-100 text-black"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                All ({availableImages.length})
              </button>
              {Object.entries(roomCounts).map(([room, count]) => (
                <button
                  key={room}
                  onClick={() => setFilterRoom(room)}
                  className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                    filterRoom === room
                      ? "bg-neutral-100 text-black"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {room} ({count})
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-neutral-500 self-center mr-1">Style:</span>
              <button
                onClick={() => setFilterStyle("All")}
                className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                  filterStyle === "All"
                    ? "bg-neutral-100 text-black"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                All ({availableImages.length})
              </button>
              {Object.entries(styleCounts).map(([style, count]) => (
                <button
                  key={style}
                  onClick={() => setFilterStyle(style)}
                  className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                    filterStyle === style
                      ? "bg-neutral-100 text-black"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {style} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Crawled Images Grid */}
        {filteredImages.length > 0 ? (
          <>
            <h2 className="text-lg font-medium mb-4">
              {filterRoom === "All" ? "All Images" : filterRoom} (
              {filteredImages.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredImages.map((img) => (
                <ImageCard
                  key={img.id}
                  imageUrl={img.imageUrl}
                  alt={img.alt}
                  isInMoodboard={moodboardMap.has(img.id)}
                  onRemove={() => removeFromMoodboard(img.id)}
                  onAdd={() => addToMoodboard(img)}
                  onIgnore={() => handleIgnore(img.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-neutral-500">
            <p className="text-lg">No images yet</p>
            <p className="text-sm mt-1">
              Select styles and rooms above, then hit Crawl
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
