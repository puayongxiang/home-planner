import fs from "fs";
import path from "path";
import MoodboardGallery from "@/components/MoodboardGallery";
import { SavedLink } from "@/lib/types";

function getEnrichedMoodboardImages() {
  const dbPath = path.join(process.cwd(), "data", "db.json");
  const raw = fs.readFileSync(dbPath, "utf-8");
  const db = JSON.parse(raw);

  const crawledMap = new Map(
    (db.crawledImages || []).map((c: { id: string; roomType?: string; style?: string }) => [c.id, c])
  );

  return (db.moodboardImages || [])
    .map((m: { crawledImageId: string; [key: string]: unknown }) => {
      const crawled = crawledMap.get(m.crawledImageId) as { roomType?: string; style?: string } | undefined;
      return {
        ...m,
        roomType: crawled?.roomType || "Uncategorised",
        style: crawled?.style || "Uncategorised",
      };
    })
    .sort((a: { addedAt: string }, b: { addedAt: string }) =>
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
}

function getSavedLinks(): SavedLink[] {
  const dbPath = path.join(process.cwd(), "data", "db.json");
  const raw = fs.readFileSync(dbPath, "utf-8");
  const db = JSON.parse(raw);
  return (db.savedLinks || []).sort(
    (a: SavedLink, b: SavedLink) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

export default function Home() {
  const images = getEnrichedMoodboardImages();
  const savedLinks = getSavedLinks();
  return <MoodboardGallery initialImages={images} initialLinks={savedLinks} />;
}
