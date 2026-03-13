import fs from "fs";
import path from "path";
import MoodboardGallery from "@/components/MoodboardGallery";

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

export default function Home() {
  const images = getEnrichedMoodboardImages();
  return <MoodboardGallery initialImages={images} />;
}
