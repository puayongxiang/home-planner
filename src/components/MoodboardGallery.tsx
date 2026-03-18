"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { MoodboardImage, SavedLink, FurnitureItem, Stroke, DrawTool, ROOM_TYPES, STYLES } from "@/lib/types";
import AnnotationCanvas from "@/components/AnnotationCanvas";

interface EnrichedMoodboardImage extends MoodboardImage {
  roomType: string;
  style: string;
}

const isStatic = process.env.NEXT_PUBLIC_STATIC === "1";

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

const SOURCE_ICONS: Record<string, string> = {
  Instagram: "IG",
  Xiaohongshu: "XHS",
  Pinterest: "Pin",
  TikTok: "TT",
  Other: "Link",
};

const SOURCE_COLORS: Record<string, string> = {
  Instagram: "#E1306C",
  Xiaohongshu: "#FE2C55",
  Pinterest: "#E60023",
  TikTok: "#000000",
  Other: "#7D8B6E",
};

function getEmbedUrl(url: string, source: string): string | null {
  if (source === "Instagram") {
    const match = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (match) return `https://www.instagram.com/${match[1]}/${match[2]}/embed/`;
  }
  return null;
}

export default function MoodboardGallery({ initialImages, initialLinks = [], initialFurniture = [] }: { initialImages: EnrichedMoodboardImage[]; initialLinks?: SavedLink[]; initialFurniture?: FurnitureItem[] }) {
  const [images, setImages] = useState<EnrichedMoodboardImage[]>(initialImages);
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>(initialLinks);
  const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>(initialFurniture);
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
  const [viewTab, setViewTab] = useState<"pinned" | "shortlisted">("pinned");
  const [addTab, setAddTab] = useState<"image" | "link" | "furniture">("image");
  const [linkForm, setLinkForm] = useState({ url: "", title: "", note: "", roomType: "", style: "" });
  const [furnitureForm, setFurnitureForm] = useState({ name: "", imageUrl: "", price: "", link: "", roomType: "", notes: "" });
  const [addingFurniture, setAddingFurniture] = useState(false);
  const [addFurnitureStatus, setAddFurnitureStatus] = useState("");
  const [addingLink, setAddingLink] = useState(false);
  const [addLinkStatus, setAddLinkStatus] = useState("");
  const lightboxImageContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const rooms = useMemo(() => {
    const set = new Set<string>();
    images.forEach((img) => set.add(img.roomType || "Uncategorised"));
    savedLinks.forEach((l) => { if (l.roomType) set.add(l.roomType); });
    furnitureItems.forEach((f) => { if (f.roomType) set.add(f.roomType); });
    return Array.from(set);
  }, [images, savedLinks, furnitureItems]);

  const styles = useMemo(() => {
    const set = new Set<string>();
    images.forEach((img) => set.add(img.style || "Uncategorised"));
    savedLinks.forEach((l) => { if (l.style) set.add(l.style); });
    return Array.from(set);
  }, [images, savedLinks]);

  const filteredImages = useMemo(() => {
    return images
      .filter((img) => filterRoom === "All" || img.roomType === filterRoom)
      .filter((img) => filterStyle === "All" || img.style === filterStyle);
  }, [images, filterRoom, filterStyle]);

  const filteredLinks = useMemo(() => {
    return savedLinks
      .filter((l) => filterRoom === "All" || l.roomType === filterRoom || (!l.roomType && filterRoom === "All"))
      .filter((l) => filterStyle === "All" || l.style === filterStyle || (!l.style && filterStyle === "All"));
  }, [savedLinks, filterRoom, filterStyle]);

  const filteredFurniture = useMemo(() => {
    return furnitureItems
      .filter((f) => filterRoom === "All" || f.roomType === filterRoom || (!f.roomType && filterRoom === "All"));
  }, [furnitureItems, filterRoom]);

  // Unified display list
  type UnifiedItem = { type: "image"; data: EnrichedMoodboardImage; date: string } | { type: "link"; data: SavedLink; date: string } | { type: "furniture"; data: FurnitureItem; date: string };
  const unifiedItems = useMemo(() => {
    const imageItems: UnifiedItem[] = filteredImages.map((img) => ({ type: "image", data: img, date: img.addedAt }));
    const linkItems: UnifiedItem[] = filteredLinks.map((l) => ({ type: "link", data: l, date: l.savedAt }));
    const furnitureItemsList: UnifiedItem[] = filteredFurniture.map((f) => ({ type: "furniture", data: f, date: f.addedAt }));
    let items: UnifiedItem[];
    if (viewTab === "pinned") {
      items = [
        ...imageItems.filter((item) => (item.data as EnrichedMoodboardImage).pinned),
        ...linkItems.filter((item) => (item.data as SavedLink).pinned),
        ...furnitureItemsList.filter((item) => (item.data as FurnitureItem).pinned),
      ];
    } else {
      // Shortlisted: exclude pinned items
      items = [
        ...imageItems.filter((item) => !(item.data as EnrichedMoodboardImage).pinned),
        ...linkItems.filter((item) => !(item.data as SavedLink).pinned),
        ...furnitureItemsList.filter((item) => !(item.data as FurnitureItem).pinned),
      ];
    }
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [filteredImages, filteredLinks, filteredFurniture, viewTab]);

  // Image-only display order for lightbox navigation
  const displayOrderImages = useMemo(() => {
    const pinned = filteredImages.filter((img) => img.pinned);
    const unpinned = filteredImages.filter((img) => !img.pinned);
    return [...pinned, ...unpinned];
  }, [filteredImages]);

  const lightboxImage = lightboxIndex !== null ? displayOrderImages[lightboxIndex] : null;

  // Zoom state for lightbox
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const zoomScaleRef = useRef(1);
  const zoomOffsetRef = useRef({ x: 0, y: 0 });

  // Keep refs in sync with state
  useEffect(() => { zoomScaleRef.current = zoomScale; }, [zoomScale]);
  useEffect(() => { zoomOffsetRef.current = zoomOffset; }, [zoomOffset]);

  // Reset zoom when switching images
  useEffect(() => {
    setZoomScale(1);
    setZoomOffset({ x: 0, y: 0 });
    pinchRef.current = null;
    panRef.current = null;
  }, [lightboxIndex]);

  // Touch handling for lightbox: swipe, pinch-to-zoom, double-tap, pan
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const getTouchDist = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isDrawMode) return;

    if (e.touches.length === 2) {
      // Pinch start
      e.preventDefault();
      pinchRef.current = { dist: getTouchDist(e.touches), scale: zoomScaleRef.current };
      panRef.current = null;
      touchStartRef.current = null;
      return;
    }

    if (e.touches.length === 1) {
      const now = Date.now();
      const touch = e.touches[0];

      // Double-tap detection
      if (now - lastTapRef.current < 300) {
        e.preventDefault();
        lastTapRef.current = 0;
        if (zoomScaleRef.current > 1) {
          setZoomScale(1);
          setZoomOffset({ x: 0, y: 0 });
        } else {
          setZoomScale(2.5);
          // Zoom toward tap point
          const container = lightboxImageContainerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            setZoomOffset({
              x: (cx - touch.clientX) * 1.5,
              y: (cy - touch.clientY) * 1.5,
            });
          }
        }
        touchStartRef.current = null;
        return;
      }
      lastTapRef.current = now;

      if (zoomScaleRef.current > 1) {
        // Pan start
        panRef.current = { x: touch.clientX, y: touch.clientY, ox: zoomOffsetRef.current.x, oy: zoomOffsetRef.current.y };
        touchStartRef.current = null;
      } else {
        // Swipe start
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      }
    }
  }, [isDrawMode]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDrawMode) return;

    if (e.touches.length === 2 && pinchRef.current) {
      // Pinch zoom
      e.preventDefault();
      const newDist = getTouchDist(e.touches);
      const newScale = Math.min(5, Math.max(1, pinchRef.current.scale * (newDist / pinchRef.current.dist)));
      setZoomScale(newScale);
      if (newScale <= 1) {
        setZoomOffset({ x: 0, y: 0 });
      }
      return;
    }

    if (e.touches.length === 1 && panRef.current && zoomScaleRef.current > 1) {
      // Pan while zoomed
      e.preventDefault();
      const touch = e.touches[0];
      setZoomOffset({
        x: panRef.current.ox + (touch.clientX - panRef.current.x),
        y: panRef.current.oy + (touch.clientY - panRef.current.y),
      });
    }
  }, [isDrawMode]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isDrawMode) return;

    // End pinch
    if (pinchRef.current) {
      if (e.touches.length < 2) {
        // Snap to 1 if close
        if (zoomScaleRef.current < 1.15) {
          setZoomScale(1);
          setZoomOffset({ x: 0, y: 0 });
        }
        pinchRef.current = null;
      }
      return;
    }

    // End pan
    if (panRef.current) {
      panRef.current = null;
      return;
    }

    // Swipe detection (only at 1x zoom)
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
      if (dx < 0) {
        setLightboxIndex((i) => (i !== null ? Math.min(i + 1, displayOrderImages.length - 1) : null));
      } else {
        setLightboxIndex((i) => (i !== null ? Math.max(i - 1, 0) : null));
      }
    }
  }, [isDrawMode, displayOrderImages.length]);

  // Lock body scroll when lightbox is open (prevents mobile scroll-behind)
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.classList.add("lightbox-open");
    } else {
      document.body.classList.remove("lightbox-open");
    }
    return () => document.body.classList.remove("lightbox-open");
  }, [lightboxIndex]);

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
          setLightboxIndex((i) => (i !== null ? Math.min(i + 1, displayOrderImages.length - 1) : null));
        if (e.key === "ArrowLeft")
          setLightboxIndex((i) => (i !== null ? Math.max(i - 1, 0) : null));
      }
      if (!isStatic && (e.ctrlKey || e.metaKey) && e.key === "z" && lightboxImage) {
        e.preventDefault();
        handleAnnotationUndo(lightboxImage.id);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, displayOrderImages.length, isDrawMode, lightboxImage]);

  function isSocialUrl(url: string): false | string {
    if (/instagram\.com\/(p|reel)\//i.test(url)) return "Instagram";
    if (/xiaohongshu\.com\/(explore|discovery)/i.test(url)) return "Xiaohongshu";
    if (/xhslink\.com\//i.test(url)) return "Xiaohongshu";
    return false;
  }

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
        const moodRes = await fetch("/api/moodboard");
        const moodData: EnrichedMoodboardImage[] = await moodRes.json();
        setImages(moodData);
      }
    } catch {
      setAddUrlStatus("Failed to add");
    } finally {
      setAddingUrl(false);
    }
  }

  async function handleAddLink() {
    const url = linkForm.url.trim();
    if (!url) return;
    setAddingLink(true);
    setAddLinkStatus("");
    try {
      const res = await fetch("/api/saved-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...linkForm, url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddLinkStatus(data.error || "Failed to save");
      } else {
        setLinkForm({ url: "", title: "", note: "", roomType: "", style: "" });
        setAddLinkStatus("Saved!");
        const linkRes = await fetch("/api/saved-links");
        setSavedLinks(await linkRes.json());
      }
    } catch {
      setAddLinkStatus("Failed to save");
    } finally {
      setAddingLink(false);
    }
  }

  async function handleAddFurniture() {
    if (!furnitureForm.name.trim()) return;
    setAddingFurniture(true);
    setAddFurnitureStatus("");
    try {
      const res = await fetch("/api/furniture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...furnitureForm, roomType: furnitureForm.roomType || undefined }),
      });
      if (res.ok) {
        setFurnitureForm({ name: "", imageUrl: "", price: "", link: "", roomType: "", notes: "" });
        setAddFurnitureStatus("Added!");
        const furnitureRes = await fetch("/api/furniture");
        setFurnitureItems(await furnitureRes.json());
      } else {
        setAddFurnitureStatus("Failed to add");
      }
    } catch {
      setAddFurnitureStatus("Failed to add");
    } finally {
      setAddingFurniture(false);
    }
  }

  async function handleToggleLinkPin(id: string) {
    const link = savedLinks.find((l) => l.id === id);
    if (!link) return;
    const newPinned = !link.pinned;
    setSavedLinks((prev) => prev.map((l) => (l.id === id ? { ...l, pinned: newPinned } : l)));
    await fetch("/api/saved-links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned: newPinned }),
    });
  }

  async function handleRemoveLink(id: string) {
    setSavedLinks((prev) => prev.filter((l) => l.id !== id));
    await fetch("/api/saved-links", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function handleLinkFieldChange(id: string, field: string, value: string) {
    setSavedLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
    const key = `link-${field}-${id}`;
    const existing = debounceTimers.current.get(key);
    if (existing) clearTimeout(existing);
    debounceTimers.current.set(
      key,
      setTimeout(async () => {
        await fetch("/api/saved-links", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, [field]: value }),
        });
        debounceTimers.current.delete(key);
      }, 500)
    );
  }

  async function handleToggleFurniturePin(id: string) {
    const item = furnitureItems.find((f) => f.id === id);
    if (!item) return;
    const newPinned = !item.pinned;
    setFurnitureItems((prev) => prev.map((f) => (f.id === id ? { ...f, pinned: newPinned } : f)));
    await fetch("/api/furniture", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned: newPinned }),
    });
  }

  async function handleRemoveFurniture(id: string) {
    setFurnitureItems((prev) => prev.filter((f) => f.id !== id));
    await fetch("/api/furniture", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function handleFurnitureFieldChange(id: string, field: string, value: string) {
    setFurnitureItems((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
    const key = `furniture-${field}-${id}`;
    const existing = debounceTimers.current.get(key);
    if (existing) clearTimeout(existing);
    debounceTimers.current.set(
      key,
      setTimeout(async () => {
        await fetch("/api/furniture", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, [field]: value }),
        });
        debounceTimers.current.delete(key);
      }, 500)
    );
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

  async function handleUpdateRoomType(moodboardId: string, crawledImageId: string, roomType: string) {
    const res = await fetch("/api/crawl", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: crawledImageId, roomType }),
    });
    if (res.ok) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === moodboardId ? { ...img, roomType } : img
        )
      );
    }
  }

  async function handleTogglePin(id: string) {
    const img = images.find((i) => i.id === id);
    if (!img) return;
    const newPinned = !img.pinned;
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, pinned: newPinned } : i)));
    await fetch("/api/moodboard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned: newPinned }),
    });
  }

  const pinnedCount = images.filter((i) => i.pinned).length + savedLinks.filter((l) => l.pinned).length + furnitureItems.filter((f) => f.pinned).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ background: "rgba(250, 250, 247, 0.9)", borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="max-w-[1800px] mx-auto px-3 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-5">
            <h1 className="text-xl sm:text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Moodcraft
            </h1>
          </div>
          {!isStatic && (
            <div className="flex items-center gap-2">
              <Link
                href="/browse"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}
              >
                Browse & Crawl
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* View tabs */}
      {(images.length > 0 || savedLinks.length > 0 || furnitureItems.length > 0) && (
        <div
          className="sticky z-[25] backdrop-blur-md"
          style={{ top: "49px", background: "rgba(250, 250, 247, 0.9)", borderBottom: "1px solid var(--border-light)" }}
        >
          <div className="max-w-[1800px] mx-auto px-3 sm:px-6 py-2 flex justify-center">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
              {([
                { key: "pinned" as const, label: "Pinned", count: pinnedCount },
                { key: "shortlisted" as const, label: "Shortlisted", count: images.length + savedLinks.length + furnitureItems.length - pinnedCount },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setViewTab(tab.key)}
                  className="px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all"
                  style={{
                    background: viewTab === tab.key ? "var(--bg-card)" : "transparent",
                    color: viewTab === tab.key ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow: viewTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky filter bar */}
      {(images.length > 0 || savedLinks.length > 0 || furnitureItems.length > 0) && rooms.length > 0 && (
        <nav
          className="sticky z-20 backdrop-blur-md"
          style={{ top: "90px", background: "rgba(250, 250, 247, 0.85)", borderBottom: "1px solid var(--border-light)" }}
        >
          {/* Desktop: single row */}
          <div
            className="hidden sm:flex max-w-[1800px] mx-auto px-6 py-2.5 items-center gap-2 overflow-x-auto"
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

          {/* Mobile: stacked rows, each horizontally scrollable */}
          <div className="sm:hidden px-3 py-2 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
              <span className="shrink-0 text-[10px] uppercase tracking-wider mr-0.5" style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}>
                Room
              </span>
              {["All", ...rooms].map((room) => (
                <button
                  key={room}
                  onClick={() => setFilterRoom(filterRoom === room && room !== "All" ? "All" : room)}
                  className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all"
                  style={{
                    background: filterRoom === room ? "var(--text-primary)" : "var(--bg-card)",
                    color: filterRoom === room ? "var(--bg-primary)" : "var(--text-secondary)",
                    border: `1px solid ${filterRoom === room ? "var(--text-primary)" : "var(--border-light)"}`,
                  }}
                >
                  {room}
                </button>
              ))}
            </div>
            {styles.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                <span className="shrink-0 text-[10px] uppercase tracking-wider mr-0.5" style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}>
                  Style
                </span>
                {["All", ...styles].map((style) => (
                  <button
                    key={style}
                    onClick={() => setFilterStyle(filterStyle === style && style !== "All" ? "All" : style)}
                    className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all"
                    style={{
                      background: filterStyle === style ? "var(--text-primary)" : "var(--bg-card)",
                      color: filterStyle === style ? "var(--bg-primary)" : "var(--text-secondary)",
                      border: `1px solid ${filterStyle === style ? "var(--text-primary)" : "var(--border-light)"}`,
                    }}
                  >
                    {style}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      )}

      <main className="max-w-[1800px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {unifiedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {unifiedItems.map((item, i) =>
              item.type === "image" ? (
                <GridCard
                  key={item.data.id}
                  img={item.data as EnrichedMoodboardImage}
                  index={i}
                  onClick={() => setLightboxIndex(displayOrderImages.indexOf(item.data as EnrichedMoodboardImage))}
                  onRemove={handleRemove}
                  onCommentChange={handleCommentChange}
                  onTogglePin={handleTogglePin}
                />
              ) : item.type === "link" ? (
                <SavedLinkCard
                  key={item.data.id}
                  link={item.data as SavedLink}
                  index={i}
                  onRemove={handleRemoveLink}
                  onFieldChange={handleLinkFieldChange}
                  onTogglePin={handleToggleLinkPin}
                />
              ) : (
                <FurnitureCard
                  key={item.data.id}
                  item={item.data as FurnitureItem}
                  index={i}
                  onRemove={handleRemoveFurniture}
                  onFieldChange={handleFurnitureFieldChange}
                  onTogglePin={handleToggleFurniturePin}
                />
              )
            )}
          </div>
        ) : images.length > 0 || savedLinks.length > 0 || furnitureItems.length > 0 ? (
          <div className="text-center py-16">
            <p className="text-lg" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>
              {viewTab === "pinned" ? "No pinned items" : "No matches"}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {viewTab === "pinned" ? "Pin images to see them here" : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>
              No items yet
            </p>
            {!isStatic && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Go{" "}
                <Link href="/browse" className="underline" style={{ color: "var(--accent-sage)" }}>
                  browse & crawl
                </Link>{" "}
                to start curating your inspiration
              </p>
            )}
          </div>
        )}
      </main>

      {/* Playground FAB — dev only */}
      {!isStatic && (
        <Link
          href="/playground"
          className="fixed bottom-6 right-24 z-40 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-md"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-muted)" }}
          title="Design Playground"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </Link>
      )}

      {/* FAB + Add URL modal — dev only */}
      {!isStatic && (
        <>
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
              className="fixed bottom-24 right-3 left-3 sm:left-auto sm:right-6 z-40 sm:w-[380px] rounded-2xl p-5 shadow-2xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", animation: "fabPanelIn 0.2s ease-out" }}
            >
              {/* Tabs */}
              <div className="flex gap-1 mb-3 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                <button
                  onClick={() => setAddTab("image")}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all"
                  style={{ background: addTab === "image" ? "var(--bg-card)" : "transparent", color: addTab === "image" ? "var(--text-primary)" : "var(--text-muted)", boxShadow: addTab === "image" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}
                >
                  Image
                </button>
                <button
                  onClick={() => setAddTab("link")}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all"
                  style={{ background: addTab === "link" ? "var(--bg-card)" : "transparent", color: addTab === "link" ? "var(--text-primary)" : "var(--text-muted)", boxShadow: addTab === "link" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}
                >
                  Link
                </button>
                <button
                  onClick={() => setAddTab("furniture")}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all"
                  style={{ background: addTab === "furniture" ? "var(--bg-card)" : "transparent", color: addTab === "furniture" ? "var(--text-primary)" : "var(--text-muted)", boxShadow: addTab === "furniture" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}
                >
                  Furniture
                </button>
              </div>

              {addTab === "image" ? (
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
                  {isSocialUrl(addUrl.trim()) && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {isSocialUrl(addUrl.trim()) === "Instagram" ? "IG" : "XHS"} link detected — switch to the <button onClick={() => setAddTab("link")} className="underline cursor-pointer" style={{ color: "var(--accent-sage)" }}>Link</button> tab to save with preview.
                    </p>
                  )}
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
              ) : addTab === "link" ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={linkForm.url}
                    onChange={(e) => { setLinkForm({ ...linkForm, url: e.target.value }); setAddLinkStatus(""); }}
                    placeholder="Paste Instagram, XHS, or any URL"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddLink(); }}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={linkForm.title}
                    onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                    placeholder="Title (optional)"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                  />
                  <div className="flex gap-2">
                    <select value={linkForm.roomType} onChange={(e) => setLinkForm({ ...linkForm, roomType: e.target.value })} className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none cursor-pointer" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: linkForm.roomType ? "var(--text-primary)" : "var(--text-muted)" }}>
                      <option value="">Room type</option>
                      {ROOM_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select value={linkForm.style} onChange={(e) => setLinkForm({ ...linkForm, style: e.target.value })} className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none cursor-pointer" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: linkForm.style ? "var(--text-primary)" : "var(--text-muted)" }}>
                      <option value="">Style</option>
                      {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAddLink} disabled={addingLink || !linkForm.url.trim()} className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" style={{ background: "var(--accent-sage)", color: "white" }}>
                    {addingLink ? "Saving..." : "Save Link"}
                  </button>
                  {addLinkStatus && (
                    <p className="text-sm text-center" style={{ color: addLinkStatus === "Saved!" ? "var(--accent-sage)" : "var(--accent-red)" }}>
                      {addLinkStatus}
                    </p>
                  )}
                </div>
              ) : addTab === "furniture" ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={furnitureForm.name}
                    onChange={(e) => { setFurnitureForm({ ...furnitureForm, name: e.target.value }); setAddFurnitureStatus(""); }}
                    placeholder="Name *"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddFurniture(); }}
                  />
                  <input
                    type="text"
                    value={furnitureForm.imageUrl}
                    onChange={(e) => setFurnitureForm({ ...furnitureForm, imageUrl: e.target.value })}
                    placeholder="Image URL"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={furnitureForm.price}
                      onChange={(e) => setFurnitureForm({ ...furnitureForm, price: e.target.value })}
                      placeholder="Price"
                      className="flex-1 px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                    />
                    <select
                      value={furnitureForm.roomType}
                      onChange={(e) => setFurnitureForm({ ...furnitureForm, roomType: e.target.value })}
                      className="flex-1 px-3 py-2.5 text-sm rounded-lg focus:outline-none cursor-pointer"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: furnitureForm.roomType ? "var(--text-primary)" : "var(--text-muted)" }}
                    >
                      <option value="">Room (optional)</option>
                      {ROOM_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={furnitureForm.link}
                    onChange={(e) => setFurnitureForm({ ...furnitureForm, link: e.target.value })}
                    placeholder="Product link"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                  />
                  <button onClick={handleAddFurniture} disabled={addingFurniture || !furnitureForm.name.trim()} className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" style={{ background: "var(--accent-sage)", color: "white" }}>
                    {addingFurniture ? "Adding..." : "Add Furniture"}
                  </button>
                  {addFurnitureStatus && (
                    <p className="text-sm text-center" style={{ color: addFurnitureStatus === "Added!" ? "var(--accent-sage)" : "var(--accent-red)" }}>
                      {addFurnitureStatus}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0, 0, 0, 0.92)" }}
          onClick={() => { if (!isDrawMode) setLightboxIndex(null); }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button className="absolute top-3 right-3 sm:top-5 sm:right-5 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 z-10" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          {/* Nav arrows — hidden on mobile (use swipe instead) */}
          {!isDrawMode && lightboxIndex! > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full hidden sm:flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i! - 1); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}
          {!isDrawMode && lightboxIndex! < displayOrderImages.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full hidden sm:flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i! + 1); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}
          <div className="w-full sm:max-w-[90vw] max-h-[85vh] flex flex-col items-center px-2 sm:px-0" onClick={(e) => e.stopPropagation()}>
            {/* Image + canvas overlay */}
            <div ref={lightboxImageContainerRef} className="relative" style={{ transform: `scale(${zoomScale}) translate(${zoomOffset.x / zoomScale}px, ${zoomOffset.y / zoomScale}px)`, transition: pinchRef.current || panRef.current ? 'none' : 'transform 0.2s ease-out', touchAction: zoomScale > 1 ? 'none' : 'pan-y' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={lightboxImage.id} src={lightboxImage.imageUrl} alt="Moodboard image" className="max-w-full max-h-[70vh] sm:max-h-[65vh] object-contain rounded-lg select-none" style={{ animation: "lightboxIn 0.2s ease-out" }} draggable={false} referrerPolicy="no-referrer" />
              <AnnotationCanvas
                containerRef={lightboxImageContainerRef}
                annotations={lightboxImage.annotations || []}
                isDrawMode={!isStatic && isDrawMode}
                currentColor={drawColor}
                currentWidth={drawWidth}
                currentTool={drawTool}
                onStrokeAdd={(stroke) => handleAnnotationAdd(lightboxImage.id, stroke)}
              />
            </div>

            {/* Drawing toolbar — dev only */}
            {!isStatic && (
              <div className="mt-3 hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
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

                <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.15)" }} />

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

                <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.15)" }} />

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

                <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.15)" }} />

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

                <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.15)" }} />

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
            )}

            {/* Zoom reset button — shown when zoomed */}
            {zoomScale > 1 && (
              <button
                className="absolute top-3 left-3 sm:top-5 sm:left-5 px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-80 z-10 text-xs font-medium"
                style={{ background: "rgba(255,255,255,0.2)", color: "white", backdropFilter: "blur(8px)" }}
                onClick={(e) => { e.stopPropagation(); setZoomScale(1); setZoomOffset({ x: 0, y: 0 }); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                {Math.round(zoomScale * 100)}%
              </button>
            )}
            {/* Swipe hint — mobile only, shown briefly */}
            <div className="mt-2 flex sm:hidden items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {lightboxIndex! > 0 && <span>&larr;</span>}
              <span>{lightboxIndex! + 1} / {displayOrderImages.length}</span>
              {lightboxIndex! < displayOrderImages.length - 1 && <span>&rarr;</span>}
              {zoomScale <= 1 && <span style={{ marginLeft: 4 }}>pinch to zoom</span>}
            </div>
            {/* Info + comment */}
            <div className="mt-2 sm:mt-3 flex flex-col items-center gap-2 w-full max-w-lg px-2 sm:px-0">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {!isStatic && (lightboxImage.roomType === "Uncategorised" || lightboxImage.roomType === "") ? (
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: "0.08em" }}>
                      Tag room:
                    </span>
                    {ROOM_TYPES.map((room) => (
                      <button
                        key={room}
                        onClick={() => handleUpdateRoomType(lightboxImage.id, lightboxImage.crawledImageId, room)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all hover:scale-105"
                        style={{
                          background: "rgba(255,255,255,0.12)",
                          color: "rgba(255,255,255,0.8)",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        {room}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {lightboxImage.roomType} &middot; {lightboxImage.style}
                  </span>
                )}
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {lightboxIndex! + 1} / {displayOrderImages.length}
                </span>
              </div>
              {!isStatic ? (
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
              ) : lightboxImage.comment ? (
                <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.7)" }}>
                  &ldquo;{lightboxImage.comment}&rdquo;
                </p>
              ) : null}
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

/* ── Grid Card ── */
function GridCard({
  img,
  index,
  onClick,
  onRemove,
  onCommentChange,
  onTogglePin,
}: {
  img: { id: string; imageUrl: string; roomType: string; style: string; comment: string; pinned?: boolean; annotations?: Stroke[] };
  index: number;
  onClick: () => void;
  onRemove: (id: string) => void;
  onCommentChange: (id: string, comment: string) => void;
  onTogglePin: (id: string) => void;
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
            className="w-full card-image grid-card-img"
            referrerPolicy="no-referrer"
          />
          <StrokesOverlay annotations={img.annotations} />
          {/* Pin ribbon indicator */}
          {img.pinned && (
            <span
              className="absolute top-0 right-4 z-10 pointer-events-none flex items-center justify-center"
              style={{ width: 28, height: 36 }}
            >
              <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
                <path d="M0 0h28v32l-14-6-14 6V0z" fill="var(--accent-terracotta, #C4775B)" />
              </svg>
              <svg className="absolute" style={{ top: 7 }} width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
          )}
          <span
            className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full pointer-events-none z-10"
            style={{ background: `${roomColor}cc`, color: "white", backdropFilter: "blur(4px)" }}
          >
            {img.roomType}
          </span>
          {img.annotations && img.annotations.length > 0 && (
            <span className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center pointer-events-none z-10" style={{ background: "rgba(255, 68, 68, 0.85)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" />
              </svg>
            </span>
          )}
          {img.style && img.style !== "Uncategorised" && (
            <span
              className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full pointer-events-none z-10"
              style={{ background: styleColor ? `${styleColor}dd` : "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)" }}
            >
              {img.style}
            </span>
          )}
          {/* Action buttons — dev only */}
          {!isStatic && (
            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:brightness-110"
                style={{ background: img.pinned ? "rgba(196, 119, 91, 0.9)" : "rgba(212, 170, 60, 0.9)", color: "white" }}
                onClick={(e) => { e.stopPropagation(); onTogglePin(img.id); }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill={img.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                {img.pinned ? "Unpin" : "Pin"}
              </button>
              <button
                className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:bg-gray-100"
                onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Remove
              </button>
            </div>
          )}
        </div>
        {/* Comment */}
        <div className="px-3 py-2.5">
          {!isStatic ? (
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
          ) : img.comment ? (
            <p className="text-sm p-2 italic" style={{ color: "var(--text-secondary)" }}>
              &ldquo;{img.comment}&rdquo;
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SavedLinkCard({
  link,
  index,
  onRemove,
  onFieldChange,
  onTogglePin,
}: {
  link: SavedLink;
  index: number;
  onRemove: (id: string) => void;
  onFieldChange: (id: string, field: string, value: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const sourceColor = SOURCE_COLORS[link.source] || SOURCE_COLORS.Other;
  const sourceIcon = SOURCE_ICONS[link.source] || SOURCE_ICONS.Other;
  const embedUrl = getEmbedUrl(link.url, link.source);

  let domain = "";
  try { domain = new URL(link.url).hostname.replace(/^www\./, ""); } catch { domain = link.url; }

  return (
    <div className="group card-enter" style={{ animationDelay: `${index * 0.03}s` }}>
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}
      >
        {/* Pin ribbon indicator */}
        {link.pinned && (
          <span
            className="absolute top-0 right-4 z-10 pointer-events-none flex items-center justify-center"
            style={{ width: 28, height: 36 }}
          >
            <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
              <path d="M0 0h28v32l-14-6-14 6V0z" fill="var(--accent-terracotta, #C4775B)" />
            </svg>
            <svg className="absolute" style={{ top: 7 }} width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        )}
        {/* Embed or placeholder */}
        {embedUrl ? (
          <div className="relative w-full" style={{ aspectRatio: "4/5" }}>
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allow="encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              {!isStatic && (
                <>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:brightness-110"
                    style={{ background: link.pinned ? "rgba(196, 119, 91, 0.9)" : "rgba(212, 170, 60, 0.9)", color: "white" }}
                    onClick={() => onTogglePin(link.id)}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill={link.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    {link.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:bg-gray-100"
                    onClick={() => onRemove(link.id)}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    Remove
                  </button>
                </>
              )}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
                title="Open original"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        ) : (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center justify-center transition-opacity hover:opacity-80 cursor-pointer"
            style={{ aspectRatio: "4/3", background: "var(--bg-secondary)" }}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: sourceColor }}>{sourceIcon}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{domain}</span>
            </div>
            {/* Action buttons */}
            {!isStatic && (
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:brightness-110"
                  style={{ background: link.pinned ? "rgba(196, 119, 91, 0.9)" : "rgba(212, 170, 60, 0.9)", color: "white" }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePin(link.id); }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={link.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  {link.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:bg-gray-100"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(link.id); }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  Remove
                </button>
              </div>
            )}
          </a>
        )}

        {/* Info */}
        <div className="px-3 py-2.5 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: sourceColor, color: "white" }}
            >
              {sourceIcon}
            </span>
            {!isStatic ? (
              <input
                type="text"
                value={link.title || ""}
                onChange={(e) => onFieldChange(link.id, "title", e.target.value)}
                placeholder="Add title..."
                className="text-sm font-medium bg-transparent focus:outline-none flex-1 min-w-0 placeholder:italic"
                style={{ color: "var(--text-primary)" }}
              />
            ) : link.title ? (
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{link.title}</span>
            ) : null}
          </div>
          {(link.roomType || link.style) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {link.roomType && (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                  {link.roomType}
                </span>
              )}
              {link.style && (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                  {link.style}
                </span>
              )}
            </div>
          )}
          {!isStatic ? (
            <textarea
              value={link.note || ""}
              onChange={(e) => onFieldChange(link.id, "note", e.target.value)}
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
          ) : link.note ? (
            <p className="text-sm p-2 italic" style={{ color: "var(--text-secondary)" }}>
              &ldquo;{link.note}&rdquo;
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FurnitureCard({
  item,
  index,
  onRemove,
  onFieldChange,
  onTogglePin,
}: {
  item: FurnitureItem;
  index: number;
  onRemove: (id: string) => void;
  onFieldChange: (id: string, field: string, value: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const roomColor = ROOM_COLORS[item.roomType || ""] || "var(--accent-sage)";
  return (
    <div className="group card-enter" style={{ animationDelay: `${index * 0.03}s` }}>
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}
      >
        {/* Pin ribbon */}
        {item.pinned && (
          <span
            className="absolute top-0 right-4 z-10 pointer-events-none flex items-center justify-center"
            style={{ width: 28, height: 36 }}
          >
            <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
              <path d="M0 0h28v32l-14-6-14 6V0z" fill="var(--accent-terracotta, #C4775B)" />
            </svg>
            <svg className="absolute" style={{ top: 7 }} width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        )}
        {/* Image */}
        {item.imageUrl ? (
          <div className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full object-cover card-image grid-card-img"
              style={{ aspectRatio: "4/3" }}
              referrerPolicy="no-referrer"
            />
            {item.roomType && (
              <span
                className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full pointer-events-none z-10"
                style={{ background: `${roomColor}cc`, color: "white", backdropFilter: "blur(4px)" }}
              >
                {item.roomType}
              </span>
            )}
            <span
              className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full pointer-events-none z-10"
              style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)" }}
            >
              Furniture
            </span>
            {!isStatic && (
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:brightness-110"
                  style={{ background: item.pinned ? "rgba(196, 119, 91, 0.9)" : "rgba(212, 170, 60, 0.9)", color: "white" }}
                  onClick={() => onTogglePin(item.id)}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={item.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  {item.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:bg-gray-100"
                  onClick={() => onRemove(item.id)}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  Remove
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative flex items-center justify-center" style={{ aspectRatio: "4/3", background: "var(--bg-secondary)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            {item.roomType && (
              <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "var(--border-light)", color: "var(--text-muted)" }}>
                {item.roomType}
              </span>
            )}
            <span
              className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full pointer-events-none z-10"
              style={{ background: "var(--border-light)", color: "var(--text-muted)" }}
            >
              Furniture
            </span>
            {!isStatic && (
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:brightness-110"
                  style={{ background: item.pinned ? "rgba(196, 119, 91, 0.9)" : "rgba(212, 170, 60, 0.9)", color: "white" }}
                  onClick={() => onTogglePin(item.id)}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={item.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  {item.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:bg-gray-100"
                  onClick={() => onRemove(item.id)}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
        {/* Info */}
        <div className="px-3.5 py-3 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            {!isStatic ? (
              <input
                type="text"
                value={item.name}
                onChange={(e) => onFieldChange(item.id, "name", e.target.value)}
                className="text-sm font-medium bg-transparent focus:outline-none flex-1 min-w-0"
                style={{ color: "var(--text-primary)" }}
              />
            ) : (
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.name}</span>
            )}
            {item.price && (
              <span className="text-sm font-medium shrink-0" style={{ color: "var(--accent-sage)" }}>
                {item.price}
              </span>
            )}
          </div>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs truncate hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              {item.link.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
            </a>
          )}
          {!isStatic ? (
            <textarea
              value={item.notes || ""}
              onChange={(e) => onFieldChange(item.id, "notes", e.target.value)}
              placeholder="Add notes..."
              className="w-full text-sm rounded-lg p-2 resize-none focus:outline-none placeholder:italic"
              style={{ background: "transparent", border: "none", color: "var(--text-primary)" }}
              rows={1}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = t.scrollHeight + "px";
              }}
            />
          ) : item.notes ? (
            <p className="text-sm p-2 italic" style={{ color: "var(--text-secondary)" }}>
              &ldquo;{item.notes}&rdquo;
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
