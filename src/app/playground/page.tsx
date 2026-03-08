"use client";

import dynamic from "next/dynamic";

const isPlaygroundEnabled =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_INCLUDE_PLAYGROUND === "true";

const PlaygroundContent = dynamic(() => import("./PlaygroundContent"), {
  ssr: false,
});

export default function PlaygroundGate() {
  if (!isPlaygroundEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <p className="text-lg" style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>
          Not found
        </p>
      </div>
    );
  }

  return <PlaygroundContent />;
}
