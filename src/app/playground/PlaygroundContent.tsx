"use client";

import { useState } from "react";
import Link from "next/link";
import { ROOM_TYPES, STYLES } from "@/lib/types";

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80",
  "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=80",
];

const MORE_IMAGES = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80",
];

const MOCK_CARDS = [
  { img: SAMPLE_IMAGES[0], room: "Living Room", style: "Japandi", note: "Love the natural wood tones" },
  { img: SAMPLE_IMAGES[1], room: "Living Room", style: "Scandinavian", note: "" },
  { img: MORE_IMAGES[0], room: "Living Room", style: "Modern", note: "Clean lines" },
  { img: SAMPLE_IMAGES[2], room: "Bedroom", style: "Minimalistic", note: "" },
  { img: MORE_IMAGES[1], room: "Bedroom", style: "Japandi", note: "Warm and cozy" },
  { img: SAMPLE_IMAGES[3], room: "Kitchen", style: "Scandinavian", note: "" },
  { img: MORE_IMAGES[2], room: "Kitchen", style: "Modern", note: "" },
  { img: MORE_IMAGES[3], room: "Bathroom", style: "Wabi-Sabi", note: "" },
  { img: MORE_IMAGES[4], room: "Dining Room", style: "Contemporary", note: "Great for entertaining" },
  { img: MORE_IMAGES[5], room: "Dining Room", style: "Eclectic", note: "" },
];

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

const STYLE_COLORS: Record<string, string> = {
  Japandi: "#C4775B",
  Scandinavian: "#6B8FAD",
  Minimalistic: "#9E9B91",
  Modern: "#1A1A18",
  "Wabi-Sabi": "#A68B6B",
  Transitional: "#8B7D9E",
  Eclectic: "#C46B8B",
  Colourful: "#D4884E",
  Contemporary: "#5B7D6E",
  Industrial: "#7A7874",
};

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sampleFilter, setSampleFilter] = useState("All");
  const [sampleView, setSampleView] = useState<"all" | "by-room">("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sampleComment, setSampleComment] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  const [sampleInput, setSampleInput] = useState("");
  const [sampleSelect, setSampleSelect] = useState("Uncategorised");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "typography", label: "Typography" },
    { id: "colors", label: "Colors" },
    { id: "buttons", label: "Buttons & Chips" },
    { id: "cards", label: "Image Cards" },
    { id: "filters", label: "Filters & Nav" },
    { id: "inputs", label: "Inputs" },
    { id: "lightbox", label: "Lightbox" },
    { id: "layout", label: "Layout" },
    { id: "moodboard", label: "Moodboard Layouts" },
  ];

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
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm transition-colors hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              &larr; Back
            </Link>
            <div className="w-px h-5" style={{ background: "var(--border-medium)" }} />
            <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Design Playground
            </h1>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--accent-sage-light)", color: "var(--accent-sage)", fontWeight: 500 }}>
            Moodcraft Components
          </span>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar nav */}
        <nav className="w-52 shrink-0 sticky top-[72px] self-start">
          <div className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="text-left px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all"
                style={{
                  background: activeTab === tab.id ? "var(--text-primary)" : "transparent",
                  color: activeTab === tab.id ? "var(--bg-primary)" : "var(--text-secondary)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {/* Overview */}
          {activeTab === "overview" && (
            <Section title="Overview" subtitle="The visual language of Moodcraft">
              <div className="grid grid-cols-3 gap-5">
                <OverviewCard
                  label="Font Display"
                  value="DM Serif Display"
                  preview={
                    <span className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>Aa</span>
                  }
                />
                <OverviewCard
                  label="Font Body"
                  value="Outfit"
                  preview={
                    <span className="text-3xl font-light" style={{ fontFamily: "var(--font-body)" }}>Aa</span>
                  }
                />
                <OverviewCard
                  label="Theme"
                  value="Warm Neutral"
                  preview={
                    <div className="flex gap-1.5">
                      {["var(--bg-primary)", "var(--accent-sage)", "var(--accent-terracotta)", "var(--text-primary)"].map((c) => (
                        <div key={c} className="w-7 h-7 rounded-full" style={{ background: c, border: "1px solid var(--border-light)" }} />
                      ))}
                    </div>
                  }
                />
                <OverviewCard
                  label="Corners"
                  value="Rounded 2xl"
                  preview={
                    <div className="w-16 h-10 rounded-2xl" style={{ background: "var(--accent-sage-light)", border: "2px solid var(--accent-sage)" }} />
                  }
                />
                <OverviewCard
                  label="Spacing"
                  value="Generous"
                  preview={
                    <div className="flex gap-1 items-end">
                      {[12, 20, 28, 36].map((h) => (
                        <div key={h} className="w-3 rounded-sm" style={{ height: h, background: "var(--accent-sage-light)" }} />
                      ))}
                    </div>
                  }
                />
                <OverviewCard
                  label="Motion"
                  value="Ease-out, 300ms"
                  preview={
                    <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                      <div className="h-full rounded-full animate-pulse" style={{ width: "60%", background: "var(--accent-sage)" }} />
                    </div>
                  }
                />
              </div>
            </Section>
          )}

          {/* Typography */}
          {activeTab === "typography" && (
            <Section title="Typography" subtitle="DM Serif Display + Outfit">
              <div className="space-y-8">
                <div className="p-6 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <p className="text-xs uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>Display Font</p>
                  <div className="space-y-3" style={{ fontFamily: "var(--font-display)" }}>
                    <p className="text-5xl">The art of space</p>
                    <p className="text-3xl">Curate your inspiration</p>
                    <p className="text-xl">Living Room &middot; Japandi</p>
                    <p className="text-base">Where design meets intention</p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <p className="text-xs uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>Body Font</p>
                  <div className="space-y-3" style={{ fontFamily: "var(--font-body)" }}>
                    <p className="text-2xl font-light">Light 300 &mdash; Subtle labels and metadata</p>
                    <p className="text-lg">Regular 400 &mdash; Body text and descriptions</p>
                    <p className="text-base font-medium">Medium 500 &mdash; Buttons and navigation</p>
                    <p className="text-sm font-semibold">Semibold 600 &mdash; Emphasis and counts</p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <p className="text-xs uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>Hierarchy</p>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-4">
                      <span className="text-xs w-16 shrink-0" style={{ color: "var(--text-muted)" }}>H1</span>
                      <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Moodcraft</h1>
                    </div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-xs w-16 shrink-0" style={{ color: "var(--text-muted)" }}>H2</span>
                      <h2 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Living Room</h2>
                    </div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-xs w-16 shrink-0" style={{ color: "var(--text-muted)" }}>Label</span>
                      <span className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Room</span>
                    </div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-xs w-16 shrink-0" style={{ color: "var(--text-muted)" }}>Body</span>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Add a note about this inspiration...</p>
                    </div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-xs w-16 shrink-0" style={{ color: "var(--text-muted)" }}>Muted</span>
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>12 saved &middot; 3 rooms</p>
                    </div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-xs w-16 shrink-0" style={{ color: "var(--text-muted)" }}>Kbd</span>
                      <div className="flex gap-2"><kbd>Esc</kbd> <kbd>&larr;</kbd> <kbd>&rarr;</kbd></div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Colors */}
          {activeTab === "colors" && (
            <Section title="Colors" subtitle="Warm neutrals with earthy accents">
              <div className="space-y-8">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Backgrounds</p>
                  <div className="grid grid-cols-3 gap-4">
                    <ColorSwatch name="bg-primary" value="#FAFAF7" cssVar="var(--bg-primary)" />
                    <ColorSwatch name="bg-secondary" value="#F2F0EB" cssVar="var(--bg-secondary)" />
                    <ColorSwatch name="bg-card" value="#FFFFFF" cssVar="var(--bg-card)" />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Text</p>
                  <div className="grid grid-cols-3 gap-4">
                    <ColorSwatch name="text-primary" value="#1A1A18" cssVar="var(--text-primary)" dark />
                    <ColorSwatch name="text-secondary" value="#6B6960" cssVar="var(--text-secondary)" dark />
                    <ColorSwatch name="text-muted" value="#9E9B91" cssVar="var(--text-muted)" />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Accents</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                      <div className="flex gap-3 mb-3">
                        <div className="w-14 h-14 rounded-xl" style={{ background: "var(--accent-sage)" }} />
                        <div className="w-14 h-14 rounded-xl" style={{ background: "var(--accent-sage-light)" }} />
                      </div>
                      <p className="text-sm font-medium">Sage</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Primary actions, positive states</p>
                    </div>
                    <div className="p-5 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                      <div className="flex gap-3 mb-3">
                        <div className="w-14 h-14 rounded-xl" style={{ background: "var(--accent-terracotta)" }} />
                        <div className="w-14 h-14 rounded-xl" style={{ background: "var(--accent-terracotta-light)" }} />
                      </div>
                      <p className="text-sm font-medium">Terracotta</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Warm accent, close/cancel</p>
                    </div>
                    <div className="p-5 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                      <div className="flex gap-3 mb-3">
                        <div className="w-14 h-14 rounded-xl" style={{ background: "var(--accent-red)" }} />
                        <div className="w-14 h-14 rounded-xl" style={{ background: "var(--accent-red-light)" }} />
                      </div>
                      <p className="text-sm font-medium">Red</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Errors, destructive actions</p>
                    </div>
                    <div className="p-5 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                      <div className="flex gap-3 mb-3">
                        <div className="w-14 h-14 rounded-xl" style={{ background: "var(--border-light)" }} />
                        <div className="w-14 h-14 rounded-xl" style={{ background: "var(--border-medium)" }} />
                      </div>
                      <p className="text-sm font-medium">Borders</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Light separators, card edges</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Style Palette</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(STYLE_COLORS).map(([style, color]) => (
                      <div key={style} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                        <div className="w-5 h-5 rounded-full" style={{ background: color }} />
                        <span className="text-sm">{style}</span>
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Buttons & Chips */}
          {activeTab === "buttons" && (
            <Section title="Buttons & Chips" subtitle="Interactive elements and status indicators">
              <div className="space-y-8">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Primary Buttons</p>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90" style={{ background: "var(--accent-sage)", color: "white" }}>
                      Add to Moodboard
                    </button>
                    <button className="px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90" style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
                      Browse & Crawl
                    </button>
                    <button className="px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90" style={{ background: "var(--accent-terracotta)", color: "white" }}>
                      Remove
                    </button>
                    <button className="px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer opacity-40" style={{ background: "var(--accent-sage)", color: "white" }}>
                      Disabled
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Outlined / Ghost</p>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-80" style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                      Cancel
                    </button>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-80" style={{ background: "transparent", color: "var(--accent-sage)", border: "1px solid var(--accent-sage)" }}>
                      Restore
                    </button>
                    <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 inline-flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                      &larr; Back to moodboard
                    </Link>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>View Toggle</p>
                  <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-light)", width: "fit-content" }}>
                    <button
                      onClick={() => setSampleView("all")}
                      className="px-4 py-2 text-xs font-medium cursor-pointer transition-all"
                      style={{
                        background: sampleView === "all" ? "var(--text-primary)" : "var(--bg-card)",
                        color: sampleView === "all" ? "var(--bg-primary)" : "var(--text-secondary)",
                      }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSampleView("by-room")}
                      className="px-4 py-2 text-xs font-medium cursor-pointer transition-all"
                      style={{
                        background: sampleView === "by-room" ? "var(--text-primary)" : "var(--bg-card)",
                        color: sampleView === "by-room" ? "var(--bg-primary)" : "var(--text-secondary)",
                        borderLeft: "1px solid var(--border-light)",
                      }}
                    >
                      By Room
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Filter Chips</p>
                  <div className="flex flex-wrap gap-2">
                    {["All", ...ROOM_TYPES.slice(0, 5)].map((room) => (
                      <button
                        key={room}
                        onClick={() => setSampleFilter(room)}
                        className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
                        style={{
                          background: sampleFilter === room ? "var(--text-primary)" : "var(--bg-card)",
                          color: sampleFilter === room ? "var(--bg-primary)" : "var(--text-secondary)",
                          border: `1px solid ${sampleFilter === room ? "var(--text-primary)" : "var(--border-light)"}`,
                        }}
                      >
                        {room}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Room Nav Chips (By-Room mode)</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { room: "Living Room", count: 8, active: true },
                      { room: "Bedroom", count: 5, active: false },
                      { room: "Kitchen", count: 3, active: false },
                    ].map(({ room, count, active }) => (
                      <button
                        key={room}
                        className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
                        style={{
                          background: active ? "var(--accent-sage)" : "var(--bg-card)",
                          color: active ? "white" : "var(--text-secondary)",
                          border: `1px solid ${active ? "var(--accent-sage)" : "var(--border-light)"}`,
                        }}
                      >
                        {room} <span className="ml-1.5 opacity-70">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Style Chips (on images)</p>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((style) => (
                      <span
                        key={style}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                        style={{
                          background: STYLE_COLORS[style] ? `${STYLE_COLORS[style]}dd` : "rgba(0,0,0,0.55)",
                          color: "rgba(255,255,255,0.95)",
                        }}
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Count Badge</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Living Room</span>
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--accent-sage-light)", color: "var(--accent-sage)", fontWeight: 500 }}>8</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: "var(--text-muted)" }}>42 saved</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>FAB (Floating Action Button)</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setFabOpen(!fabOpen)}
                      className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 shadow-lg"
                      style={{ background: fabOpen ? "var(--accent-terracotta)" : "var(--accent-sage)", color: "white" }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: fabOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s ease" }}>
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Click to toggle state</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Icon Buttons (Lightbox)</p>
                  <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(0,0,0,0.7)", color: "white" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                    <button className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(0,0,0,0.5)", color: "white" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <button className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(0,0,0,0.5)", color: "white" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(0,0,0,0.5)", color: "white", backdropFilter: "blur(4px)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Image Cards */}
          {activeTab === "cards" && (
            <Section title="Image Cards" subtitle="Masonry grid cards with hover effects">
              <div className="space-y-8">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Moodboard Card (hover to see effects)</p>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                    {SAMPLE_IMAGES.map((url, i) => (
                      <div key={i} className="group">
                        <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                          <div className="relative overflow-hidden cursor-pointer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="Sample" className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105" />
                            <span className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: Object.values(STYLE_COLORS)[i] + "dd", color: "rgba(255,255,255,0.95)" }}>
                              {Object.keys(STYLE_COLORS)[i]}
                            </span>
                            <button className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)", color: "white", backdropFilter: "blur(4px)" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </div>
                          <div className="px-3.5 py-3">
                            <textarea
                              placeholder="Add a note..."
                              className="w-full text-sm rounded-lg p-2.5 resize-none focus:outline-none placeholder:italic"
                              style={{ background: "transparent", border: "none", color: "var(--text-primary)" }}
                              rows={1}
                              defaultValue={i === 0 ? "Love the natural wood tones" : ""}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Browse Card (Add / Ignore split hover)</p>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                    {SAMPLE_IMAGES.slice(0, 2).map((url, i) => (
                      <div key={i} className="group relative rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
                        <div className="relative aspect-[4/3]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="Sample" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                          <div className="absolute inset-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-1/2 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors">
                              <span className="bg-neutral-700 text-neutral-200 px-4 py-2 rounded-full text-sm font-medium">Ignore</span>
                            </div>
                            <div className="w-1/2 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors">
                              <span className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium">+ Add</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Section Header (Room subheader)</p>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>Living Room</h2>
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--accent-sage-light)", color: "var(--accent-sage)", fontWeight: 500 }}>8</span>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Filters & Nav */}
          {activeTab === "filters" && (
            <Section title="Filters & Nav" subtitle="Sticky header, filter bar, and navigation patterns">
              <div className="space-y-8">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Header</p>
                  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
                    <div className="px-6 py-3 flex items-center justify-between" style={{ background: "rgba(250, 250, 247, 0.95)", borderBottom: "1px solid var(--border-light)" }}>
                      <div className="flex items-center gap-5">
                        <span className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Moodcraft</span>
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>42 saved</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
                          <span className="px-3 py-1.5 text-xs font-medium" style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>All</span>
                          <span className="px-3 py-1.5 text-xs font-medium" style={{ background: "var(--bg-card)", color: "var(--text-secondary)", borderLeft: "1px solid var(--border-light)" }}>By Room</span>
                        </div>
                        <span className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>Browse & Crawl</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Filter Bar (All View)</p>
                  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
                    <div className="px-6 py-2.5 flex items-center gap-2 overflow-x-auto" style={{ background: "rgba(250, 250, 247, 0.85)" }}>
                      <span className="shrink-0 text-xs uppercase tracking-wider mr-1" style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}>Room</span>
                      {["All", "Living Room", "Bedroom", "Kitchen"].map((room) => (
                        <span key={room} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium" style={{
                          background: room === "All" ? "var(--text-primary)" : "var(--bg-card)",
                          color: room === "All" ? "var(--bg-primary)" : "var(--text-secondary)",
                          border: `1px solid ${room === "All" ? "var(--text-primary)" : "var(--border-light)"}`,
                        }}>{room}</span>
                      ))}
                      <div className="shrink-0 w-px h-5 mx-1" style={{ background: "var(--border-medium)" }} />
                      <span className="shrink-0 text-xs uppercase tracking-wider mr-1" style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em" }}>Style</span>
                      {["All", "Japandi", "Scandinavian"].map((style) => (
                        <span key={style} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium" style={{
                          background: style === "All" ? "var(--text-primary)" : "var(--bg-card)",
                          color: style === "All" ? "var(--bg-primary)" : "var(--text-secondary)",
                          border: `1px solid ${style === "All" ? "var(--text-primary)" : "var(--border-light)"}`,
                        }}>{style}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Page Links</p>
                  <div className="flex gap-4">
                    {[
                      { label: "Browse & Crawl", href: "/browse" },
                      { label: "Ignored", href: "/ignored" },
                      { label: "Playground", href: "/playground" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-light)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Inputs */}
          {activeTab === "inputs" && (
            <Section title="Inputs" subtitle="Form fields, text areas, and selects">
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Text Input</p>
                    <input
                      type="text"
                      value={sampleInput}
                      onChange={(e) => setSampleInput(e.target.value)}
                      placeholder="Image URL or page URL"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Select</p>
                    <select
                      value={sampleSelect}
                      onChange={(e) => setSampleSelect(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none cursor-pointer"
                      style={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-light)",
                        color: sampleSelect === "Uncategorised" ? "var(--text-muted)" : "var(--text-primary)",
                      }}
                    >
                      <option value="Uncategorised">Room type</option>
                      {ROOM_TYPES.map((room) => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Textarea / Comment</p>
                  <div className="max-w-md rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                    <div className="px-3.5 py-3">
                      <textarea
                        value={sampleComment}
                        onChange={(e) => setSampleComment(e.target.value)}
                        placeholder="Add a note..."
                        className="w-full text-sm rounded-lg p-2.5 resize-none focus:outline-none placeholder:italic"
                        style={{ background: "transparent", border: "none", color: "var(--text-primary)" }}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Add URL Panel</p>
                  <div className="w-[380px] rounded-2xl p-5 shadow-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                    <h3 className="text-base mb-3" style={{ fontFamily: "var(--font-display)" }}>Add image</h3>
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="Image URL or page URL"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none"
                        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                      />
                      <div className="flex gap-2">
                        <select className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none cursor-pointer" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-muted)" }}>
                          <option>Room type</option>
                        </select>
                        <select className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none cursor-pointer" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-muted)" }}>
                          <option>Style</option>
                        </select>
                      </div>
                      <button className="w-full py-2.5 rounded-lg text-sm font-medium cursor-pointer" style={{ background: "var(--accent-sage)", color: "white" }}>
                        Add to Moodboard
                      </button>
                      <p className="text-sm text-center" style={{ color: "var(--accent-sage)" }}>Added!</p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Lightbox */}
          {activeTab === "lightbox" && (
            <Section title="Lightbox" subtitle="Fullscreen image viewer with navigation">
              <div className="space-y-6">
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90"
                  style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}
                >
                  Open Lightbox Demo
                </button>

                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
                  <div className="relative aspect-video flex items-center justify-center" style={{ background: "#111" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={SAMPLE_IMAGES[0]} alt="Sample" className="max-h-full object-contain rounded-lg" />
                    <button className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                    <button className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Living Room &middot; Japandi</span>
                      <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>&ldquo;Love the natural wood tones&rdquo;</p>
                      <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>1 / 42</p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Moodboard Layouts */}
          {activeTab === "moodboard" && (
            <Section title="Moodboard Layouts" subtitle="Compare two layout variations side by side">
              <div className="space-y-16">
                {/* Variation A: Current — Masonry with room subheaders */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "var(--accent-sage)", color: "white" }}>A</span>
                    <h3 className="text-lg font-medium" style={{ fontFamily: "var(--font-display)" }}>Masonry + Room Subheaders</h3>
                  </div>
                  <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    Variable-height masonry grid grouped by room. Accent bar per room, style chip on each image. Current layout.
                  </p>
                  <div className="rounded-2xl overflow-hidden p-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)" }}>
                    {(() => {
                      const groups: Record<string, typeof MOCK_CARDS> = {};
                      MOCK_CARDS.forEach((c) => {
                        if (!groups[c.room]) groups[c.room] = [];
                        groups[c.room].push(c);
                      });
                      return Object.entries(groups).map(([room, cards]) => (
                        <div key={room} className="mb-8 last:mb-0">
                          {/* Room header with accent bar */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-1 h-7 rounded-full" style={{ background: ROOM_COLORS[room] || "var(--accent-sage)" }} />
                            <h4 className="text-lg" style={{ fontFamily: "var(--font-display)" }}>{room}</h4>
                            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${ROOM_COLORS[room] || "var(--accent-sage)"}18`, color: ROOM_COLORS[room] || "var(--accent-sage)", fontWeight: 500 }}>
                              {cards.length}
                            </span>
                            <div className="flex-1 h-px" style={{ background: `${ROOM_COLORS[room] || "var(--accent-sage)"}20` }} />
                          </div>
                          {/* Masonry */}
                          <div className="columns-2 lg:columns-3 gap-4">
                            {cards.map((card, i) => (
                              <div key={i} className="break-inside-avoid mb-4 group">
                                <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                                  <div className="relative overflow-hidden cursor-pointer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={card.img} alt={card.room} className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" style={{ aspectRatio: i % 3 === 0 ? "3/4" : "4/3" }} />
                                    {card.style !== "Uncategorised" && (
                                      <span className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0" style={{ background: `${STYLE_COLORS[card.style] || "rgba(0,0,0,0.55)"}dd`, color: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)" }}>
                                        {card.style}
                                      </span>
                                    )}
                                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-1 group-hover:translate-y-0" style={{ background: "rgba(0,0,0,0.5)", color: "white", backdropFilter: "blur(4px)" }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                  </div>
                                  <div className="px-3.5 py-2.5">
                                    <p className="text-sm placeholder:italic" style={{ color: card.note ? "var(--text-primary)" : "var(--text-muted)", fontStyle: card.note ? "normal" : "italic" }}>
                                      {card.note || "Add a note..."}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px" style={{ background: "var(--border-medium)" }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>vs</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border-medium)" }} />
                </div>

                {/* Variation B: Uniform grid with featured hero card */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "var(--accent-terracotta)", color: "white" }}>B</span>
                    <h3 className="text-lg font-medium" style={{ fontFamily: "var(--font-display)" }}>Uniform Grid + Featured Hero</h3>
                  </div>
                  <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    Consistent aspect-ratio grid. Latest image is a full-width hero. Room shown as colored tag, style as overlay chip. No subheaders — filters only.
                  </p>
                  <div className="rounded-2xl overflow-hidden p-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)" }}>
                    {/* Hero — latest image */}
                    <div className="mb-5 group">
                      <div className="rounded-2xl overflow-hidden relative cursor-pointer" style={{ border: "1px solid var(--border-light)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={MOCK_CARDS[0].img} alt="Featured" className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" style={{ aspectRatio: "21/9" }} />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)" }} />
                        <div className="absolute bottom-4 left-5 flex items-center gap-2.5">
                          <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ background: ROOM_COLORS[MOCK_CARDS[0].room], color: "white" }}>
                            {MOCK_CARDS[0].room}
                          </span>
                          <span className="text-xs font-medium px-2.5 py-1.5 rounded-full" style={{ background: `${STYLE_COLORS[MOCK_CARDS[0].style]}dd`, color: "rgba(255,255,255,0.95)" }}>
                            {MOCK_CARDS[0].style}
                          </span>
                        </div>
                        {MOCK_CARDS[0].note && (
                          <p className="absolute bottom-4 right-5 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                            &ldquo;{MOCK_CARDS[0].note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Uniform grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {MOCK_CARDS.slice(1).map((card, i) => (
                        <div key={i} className="group">
                          <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                            <div className="relative overflow-hidden cursor-pointer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={card.img} alt={card.room} className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" style={{ aspectRatio: "4/3" }} />
                              {/* Room tag — top left, always visible */}
                              <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: `${ROOM_COLORS[card.room] || "var(--accent-sage)"}cc`, color: "white", backdropFilter: "blur(4px)" }}>
                                {card.room}
                              </span>
                              {/* Style chip — bottom left, on hover */}
                              {card.style !== "Uncategorised" && (
                                <span className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0" style={{ background: `${STYLE_COLORS[card.style] || "rgba(0,0,0,0.55)"}dd`, color: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)" }}>
                                  {card.style}
                                </span>
                              )}
                              <button className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: "rgba(0,0,0,0.5)", color: "white", backdropFilter: "blur(4px)" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                              </button>
                            </div>
                            {card.note && (
                              <div className="px-3 py-2">
                                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>&ldquo;{card.note}&rdquo;</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px" style={{ background: "var(--border-medium)" }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>vs</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border-medium)" }} />
                </div>

                {/* Variation C: Editorial / Magazine strip */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "#8B7D9E", color: "white" }}>C</span>
                    <h3 className="text-lg font-medium" style={{ fontFamily: "var(--font-display)" }}>Editorial Strip</h3>
                  </div>
                  <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    Magazine-style horizontal strips per room. Large cinematic images in a horizontal scroll. Feels editorial and curated, great for storytelling.
                  </p>
                  <div className="rounded-2xl overflow-hidden p-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)" }}>
                    {(() => {
                      const groups: Record<string, typeof MOCK_CARDS> = {};
                      MOCK_CARDS.forEach((c) => {
                        if (!groups[c.room]) groups[c.room] = [];
                        groups[c.room].push(c);
                      });
                      return Object.entries(groups).map(([room, cards], gi) => (
                        <div key={room} className="mb-10 last:mb-0">
                          {/* Editorial room header */}
                          <div className="flex items-end gap-4 mb-4">
                            <span className="text-4xl font-light leading-none" style={{ fontFamily: "var(--font-display)", color: `${ROOM_COLORS[room] || "var(--accent-sage)"}40` }}>
                              {String(gi + 1).padStart(2, "0")}
                            </span>
                            <div>
                              <h4 className="text-lg leading-tight" style={{ fontFamily: "var(--font-display)" }}>{room}</h4>
                              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{cards.length} inspiration{cards.length !== 1 ? "s" : ""}</p>
                            </div>
                            <div className="flex-1 h-px mb-1.5" style={{ background: "var(--border-light)" }} />
                          </div>
                          {/* Horizontal scroll strip */}
                          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                            {cards.map((card, i) => (
                              <div key={i} className="shrink-0 group" style={{ width: cards.length === 1 ? "100%" : "320px" }}>
                                <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                                  <div className="relative overflow-hidden cursor-pointer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={card.img} alt={card.room} className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ aspectRatio: "16/10" }} />
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)" }} />
                                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: `${STYLE_COLORS[card.style] || "rgba(0,0,0,0.55)"}dd`, color: "rgba(255,255,255,0.95)" }}>
                                        {card.style}
                                      </span>
                                      {card.note && (
                                        <span className="text-[11px] italic" style={{ color: "rgba(255,255,255,0.8)" }}>
                                          &ldquo;{card.note}&rdquo;
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px" style={{ background: "var(--border-medium)" }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>vs</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border-medium)" }} />
                </div>

                {/* Variation D: Mood Collage — overlapping, organic */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "#A68B6B", color: "white" }}>D</span>
                    <h3 className="text-lg font-medium" style={{ fontFamily: "var(--font-display)" }}>Mood Collage</h3>
                  </div>
                  <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    Organic, slightly overlapping collage layout. Mixed sizes with subtle rotation. Feels like a real physical mood board pinned to a wall.
                  </p>
                  <div className="rounded-2xl overflow-hidden relative" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", minHeight: 700 }}>
                    {/* Subtle pin-board texture */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, var(--text-primary) 0.5px, transparent 0.5px)", backgroundSize: "16px 16px" }} />
                    <div className="relative p-8">
                      {/* Row 1: staggered large + small */}
                      <div className="flex gap-5 mb-[-20px]">
                        <div className="group" style={{ width: "45%", transform: "rotate(-1.5deg)" }}>
                          <div className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:rotate-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                            <div className="relative overflow-hidden cursor-pointer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={MOCK_CARDS[0].img} alt="" className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ aspectRatio: "4/3" }} />
                              <span className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: `${STYLE_COLORS[MOCK_CARDS[0].style]}dd`, color: "rgba(255,255,255,0.95)" }}>{MOCK_CARDS[0].style}</span>
                            </div>
                            <div className="px-3 py-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ background: ROOM_COLORS[MOCK_CARDS[0].room] }} />
                              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{MOCK_CARDS[0].room}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-4" style={{ width: "28%", marginTop: "30px" }}>
                          <div className="group" style={{ transform: "rotate(1deg)" }}>
                            <div className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:rotate-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                              <div className="relative overflow-hidden cursor-pointer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={MOCK_CARDS[1].img} alt="" className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ aspectRatio: "1/1" }} />
                                <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${STYLE_COLORS[MOCK_CARDS[1].style]}dd`, color: "rgba(255,255,255,0.95)" }}>{MOCK_CARDS[1].style}</span>
                              </div>
                            </div>
                          </div>
                          <div className="group" style={{ transform: "rotate(-0.5deg)" }}>
                            <div className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:rotate-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                              <div className="relative overflow-hidden cursor-pointer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={MOCK_CARDS[5].img} alt="" className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ aspectRatio: "3/2" }} />
                                <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${STYLE_COLORS[MOCK_CARDS[5].style]}dd`, color: "rgba(255,255,255,0.95)" }}>{MOCK_CARDS[5].style}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="group" style={{ width: "25%", marginTop: "15px", transform: "rotate(2deg)" }}>
                          <div className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:rotate-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                            <div className="relative overflow-hidden cursor-pointer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={MOCK_CARDS[2].img} alt="" className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ aspectRatio: "3/4" }} />
                              <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${STYLE_COLORS[MOCK_CARDS[2].style]}dd`, color: "rgba(255,255,255,0.95)" }}>{MOCK_CARDS[2].style}</span>
                            </div>
                            <div className="px-3 py-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ background: ROOM_COLORS[MOCK_CARDS[2].room] }} />
                              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{MOCK_CARDS[2].room}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Row 2 */}
                      <div className="flex gap-5 mt-6">
                        <div className="group" style={{ width: "22%", transform: "rotate(1.5deg)", marginTop: "10px" }}>
                          <div className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:rotate-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                            <div className="relative overflow-hidden cursor-pointer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={MOCK_CARDS[3].img} alt="" className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ aspectRatio: "1/1" }} />
                              <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${STYLE_COLORS[MOCK_CARDS[3].style]}dd`, color: "rgba(255,255,255,0.95)" }}>{MOCK_CARDS[3].style}</span>
                            </div>
                          </div>
                        </div>
                        <div className="group" style={{ width: "35%", transform: "rotate(-1deg)" }}>
                          <div className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:rotate-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                            <div className="relative overflow-hidden cursor-pointer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={MOCK_CARDS[7].img} alt="" className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ aspectRatio: "16/9" }} />
                              <span className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: `${STYLE_COLORS[MOCK_CARDS[7].style]}dd`, color: "rgba(255,255,255,0.95)" }}>{MOCK_CARDS[7].style}</span>
                            </div>
                            <div className="px-3 py-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ background: ROOM_COLORS[MOCK_CARDS[7].room] }} />
                              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{MOCK_CARDS[7].room}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-4" style={{ width: "40%" }}>
                          <div className="flex gap-4">
                            <div className="group flex-1" style={{ transform: "rotate(0.5deg)" }}>
                              <div className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:rotate-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                                <div className="relative overflow-hidden cursor-pointer">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={MOCK_CARDS[8].img} alt="" className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ aspectRatio: "4/3" }} />
                                  <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${STYLE_COLORS[MOCK_CARDS[8].style]}dd`, color: "rgba(255,255,255,0.95)" }}>{MOCK_CARDS[8].style}</span>
                                </div>
                              </div>
                            </div>
                            <div className="group flex-1" style={{ transform: "rotate(-2deg)", marginTop: "15px" }}>
                              <div className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:rotate-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                                <div className="relative overflow-hidden cursor-pointer">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={MOCK_CARDS[9].img} alt="" className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ aspectRatio: "3/4" }} />
                                  <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${STYLE_COLORS[MOCK_CARDS[9].style]}dd`, color: "rgba(255,255,255,0.95)" }}>{MOCK_CARDS[9].style}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Decorative notes */}
                      <div className="absolute top-6 right-8 max-w-[140px] p-3 rounded-lg" style={{ background: "var(--accent-sage-light)", transform: "rotate(3deg)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                        <p className="text-[11px] italic" style={{ color: "var(--accent-sage)", fontFamily: "var(--font-display)" }}>&ldquo;Love the natural wood tones&rdquo;</p>
                      </div>
                      <div className="absolute bottom-12 left-6 max-w-[120px] p-2.5 rounded-lg" style={{ background: "var(--accent-terracotta-light)", transform: "rotate(-2deg)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                        <p className="text-[10px] italic" style={{ color: "var(--accent-terracotta)", fontFamily: "var(--font-display)" }}>&ldquo;Warm and cozy&rdquo;</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Layout */}
          {activeTab === "layout" && (
            <Section title="Layout" subtitle="Masonry grid, spacing, and empty states">
              <div className="space-y-8">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Masonry Grid (4 columns)</p>
                  <div className="columns-4 gap-5">
                    {[180, 240, 160, 280, 200, 220, 170, 260].map((h, i) => (
                      <div
                        key={i}
                        className="break-inside-avoid mb-5 rounded-2xl"
                        style={{ height: h, background: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Empty State</p>
                  <div className="rounded-2xl p-12 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                    <p className="text-2xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>Nothing saved yet</p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Go <span className="underline" style={{ color: "var(--accent-sage)" }}>browse & crawl</span> to start curating your inspiration
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>No Matches State</p>
                  <div className="rounded-2xl p-12 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                    <p className="text-lg" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>No matches</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Try adjusting your filters</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Status Messages</p>
                  <div className="flex flex-col gap-3 max-w-md">
                    <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "var(--accent-sage-light)", color: "var(--accent-sage)" }}>
                      Successfully crawled 24 images from 3 rooms
                    </div>
                    <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "var(--accent-red-light)", color: "var(--accent-red)" }}>
                      Could not find og:image in page
                    </div>
                    <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "var(--accent-terracotta-light)", color: "var(--accent-terracotta)" }}>
                      This image has already been added
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}
        </main>
      </div>

      {/* Lightbox demo overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0, 0, 0, 0.85)" }}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
            onClick={() => setLightboxOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={(e) => e.stopPropagation()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={(e) => e.stopPropagation()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SAMPLE_IMAGES[0]} alt="Demo" className="max-w-full max-h-[75vh] object-contain rounded-lg" style={{ animation: "lightboxIn 0.2s ease-out" }} />
            <div className="mt-4 text-center">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Living Room &middot; Japandi</span>
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>&ldquo;Love the natural wood tones&rdquo;</p>
              <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>1 / 4</p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes lightboxIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mb-16">
      <div className="mb-8">
        <h2 className="text-3xl mb-1" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function OverviewCard({ label, value, preview }: { label: string; value: string; preview: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl flex flex-col justify-between gap-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", minHeight: 140 }}>
      <div>{preview}</div>
      <div>
        <p className="text-sm font-medium">{value}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
      </div>
    </div>
  );
}

function ColorSwatch({ name, value, cssVar, dark }: { name: string; value: string; cssVar: string; dark?: boolean }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
      <div className="h-20" style={{ background: cssVar }} />
      <div className="px-4 py-3" style={{ background: "var(--bg-card)" }}>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{value}</p>
      </div>
    </div>
  );
}
