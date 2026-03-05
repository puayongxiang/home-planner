"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import ImageCard from "@/components/ImageCard";
import { MoodboardImage } from "@/lib/types";

export default function MoodboardPage() {
  const [images, setImages] = useState<MoodboardImage[]>([]);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const loadMoodboard = useCallback(async () => {
    const res = await fetch("/api/moodboard");
    const data: MoodboardImage[] = await res.json();
    setImages(data);
  }, []);

  useEffect(() => {
    loadMoodboard();
  }, [loadMoodboard]);

  function handleCommentChange(id: string, comment: string) {
    // Optimistic update
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, comment } : img))
    );

    // Debounced save
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
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 sticky top-0 bg-neutral-950/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-neutral-400 hover:text-white text-sm"
            >
              &larr; Browse
            </Link>
            <h1 className="text-xl font-semibold">Moodboard</h1>
          </div>
          <span className="text-sm text-neutral-400">
            {images.length} image{images.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img) => (
              <ImageCard
                key={img.id}
                imageUrl={img.imageUrl}
                isInMoodboard
                showComment
                comment={img.comment}
                onCommentChange={(c) => handleCommentChange(img.id, c)}
                onRemove={() => handleRemove(img.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-neutral-500">
            <p className="text-lg">Your moodboard is empty</p>
            <p className="text-sm mt-1">
              Go back to{" "}
              <Link href="/" className="text-emerald-500 hover:underline">
                browse
              </Link>{" "}
              and add some images
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
