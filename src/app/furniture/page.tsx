"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { FurnitureItem, ROOM_TYPES } from "@/lib/types";

export default function FurniturePage() {
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [filterRoom, setFilterRoom] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", imageUrl: "", price: "", link: "", roomType: "", notes: "" });
  const [adding, setAdding] = useState(false);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const load = useCallback(async () => {
    const res = await fetch("/api/furniture");
    setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const rooms = Array.from(new Set(items.map((i) => i.roomType).filter(Boolean))) as string[];

  const filtered = filterRoom === "All" ? items : items.filter((i) => i.roomType === filterRoom);

  async function handleAdd() {
    if (!form.name.trim()) return;
    setAdding(true);
    await fetch("/api/furniture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, roomType: form.roomType || undefined }),
    });
    setForm({ name: "", imageUrl: "", price: "", link: "", roomType: "", notes: "" });
    setShowAdd(false);
    setAdding(false);
    await load();
  }

  async function handleRemove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch("/api/furniture", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function handleFieldChange(id: string, field: string, value: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    const key = `${field}-${id}`;
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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ background: "rgba(250, 250, 247, 0.9)", borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/" className="text-2xl tracking-tight hover:opacity-70 transition-opacity" style={{ fontFamily: "var(--font-display)" }}>
              Moodcraft
            </Link>
            <span className="text-sm px-2.5 py-1 rounded-full" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
              Furniture
            </span>
            {items.length > 0 && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
            >
              Moodboard
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

      {/* Filter bar */}
      {rooms.length > 0 && (
        <nav
          className="sticky z-20 backdrop-blur-md"
          style={{ top: "49px", background: "rgba(250, 250, 247, 0.85)", borderBottom: "1px solid var(--border-light)" }}
        >
          <div className="max-w-[1400px] mx-auto px-6 py-2.5 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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
          </div>
        </nav>
      )}

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {items.length === 0 && !showAdd ? (
          <div className="text-center py-20">
            <p className="text-2xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>
              No furniture yet
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Start collecting furniture and fittings for your renovation
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90"
              style={{ background: "var(--accent-sage)", color: "white" }}
            >
              Add first item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item) => (
              <FurnitureCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onFieldChange={handleFieldChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 shadow-lg"
        style={{ background: showAdd ? "var(--accent-terracotta)" : "var(--accent-sage)", color: "white" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showAdd ? "rotate(45deg)" : "none", transition: "transform 0.2s ease" }}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Add panel */}
      {showAdd && (
        <div
          className="fixed bottom-24 right-6 z-40 w-[400px] rounded-2xl p-5 shadow-2xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", animation: "fabPanelIn 0.2s ease-out" }}
        >
          <h3 className="text-base mb-3" style={{ fontFamily: "var(--font-display)" }}>Add furniture</h3>
          <div className="flex flex-col gap-2.5">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name *"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="Image URL"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Price"
                className="flex-1 px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              />
              <select
                value={form.roomType}
                onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                className="flex-1 px-3 py-2.5 text-sm rounded-lg focus:outline-none cursor-pointer"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: form.roomType ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                <option value="">Room (optional)</option>
                {ROOM_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <input
              type="text"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="Product link"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !form.name.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{ background: "var(--accent-sage)", color: "white" }}
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fabPanelIn {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function FurnitureCard({
  item,
  onRemove,
  onFieldChange,
}: {
  item: FurnitureItem;
  onRemove: (id: string) => void;
  onFieldChange: (id: string, field: string, value: string) => void;
}) {
  return (
    <div
      className="group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      {/* Image */}
      {item.imageUrl ? (
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full object-cover"
            style={{ aspectRatio: "4/3" }}
            referrerPolicy="no-referrer"
          />
          {/* Remove button */}
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
            onClick={() => onRemove(item.id)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {/* Room tag */}
          {item.roomType && (
            <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.5)", color: "white", backdropFilter: "blur(4px)" }}>
              {item.roomType}
            </span>
          )}
        </div>
      ) : (
        <div className="relative flex items-center justify-center" style={{ aspectRatio: "4/3", background: "var(--bg-secondary)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
            <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
          {/* Remove button */}
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.15)", color: "var(--text-muted)" }}
            onClick={() => onRemove(item.id)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {item.roomType && (
            <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "var(--border-light)", color: "var(--text-muted)" }}>
              {item.roomType}
            </span>
          )}
        </div>
      )}

      {/* Info */}
      <div className="px-3.5 py-3 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <input
            type="text"
            value={item.name}
            onChange={(e) => onFieldChange(item.id, "name", e.target.value)}
            className="text-sm font-medium bg-transparent focus:outline-none flex-1 min-w-0"
            style={{ color: "var(--text-primary)" }}
          />
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
        <textarea
          value={item.notes || ""}
          onChange={(e) => onFieldChange(item.id, "notes", e.target.value)}
          placeholder="Add notes..."
          className="text-xs rounded-lg p-1.5 resize-none focus:outline-none placeholder:italic"
          style={{ background: "transparent", border: "none", color: "var(--text-secondary)" }}
          rows={1}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = t.scrollHeight + "px";
          }}
        />
      </div>
    </div>
  );
}
