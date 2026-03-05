import fs from "fs";
import path from "path";

export type { CrawledImage, MoodboardImage } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface DB {
  crawledImages: import("./types").CrawledImage[];
  moodboardImages: import("./types").MoodboardImage[];
  ignoredIds: string[];
}

export function readDB(): DB {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  const db = JSON.parse(raw);
  if (!db.ignoredIds) db.ignoredIds = [];
  return db;
}

export function writeDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
