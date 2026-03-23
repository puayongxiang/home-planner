import { readFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_PATH = path.join(process.cwd(), "data", "db.json");
const BATCH_SIZE = 500;

if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
}

const raw = await readFile(DB_PATH, "utf-8");
const db = JSON.parse(raw);

function chunk(rows, size) {
  const batches = [];
  for (let index = 0; index < rows.length; index += size) {
    batches.push(rows.slice(index, index + size));
  }
  return batches;
}

async function upsertRows(table, rows, onConflict) {
  if (rows.length === 0) {
    console.log(`Skipping ${table}: no rows`);
    return;
  }

  const endpoint = new URL(`/rest/v1/${table}`, SUPABASE_URL);
  endpoint.searchParams.set("on_conflict", onConflict);

  const batches = chunk(rows, BATCH_SIZE);
  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed importing ${table} batch ${index + 1}/${batches.length}: ${body}`);
    }

    console.log(`Imported ${table} batch ${index + 1}/${batches.length} (${batch.length} rows)`);
  }
}

const crawledImages = (db.crawledImages || []).map((image) => ({
  id: image.id,
  source_url: image.sourceUrl,
  image_url: image.imageUrl,
  alt: image.alt || "",
  room_type: image.roomType || "Uncategorised",
  style: image.style || "Uncategorised",
  source: image.source || null,
  crawled_at: image.crawledAt,
}));

const moodboardImages = (db.moodboardImages || []).map((image) => ({
  id: image.id,
  crawled_image_id: image.crawledImageId,
  image_url: image.imageUrl,
  comment: image.comment || "",
  pinned: image.pinned ?? false,
  annotations: image.annotations ?? null,
  added_at: image.addedAt,
}));

const savedLinks = (db.savedLinks || []).map((link) => ({
  id: link.id,
  url: link.url,
  source: link.source,
  title: link.title || "",
  note: link.note || "",
  room_type: link.roomType || "",
  style: link.style || "",
  pinned: link.pinned ?? false,
  saved_at: link.savedAt,
}));

const furnitureItems = (db.furnitureItems || []).map((item) => ({
  id: item.id,
  name: item.name,
  image_url: item.imageUrl || null,
  price: item.price || null,
  link: item.link || null,
  room_type: item.roomType || null,
  notes: item.notes || null,
  pinned: item.pinned ?? false,
  added_at: item.addedAt,
}));

const ignoredImages = (db.ignoredIds || []).map((crawledImageId) => ({
  crawled_image_id: crawledImageId,
}));

console.log(`Importing data from ${DB_PATH}`);

await upsertRows("crawled_images", crawledImages, "id");
await upsertRows("saved_links", savedLinks, "id");
await upsertRows("furniture_items", furnitureItems, "id");
await upsertRows("moodboard_images", moodboardImages, "id");
await upsertRows("ignored_images", ignoredImages, "crawled_image_id");

console.log("Supabase import complete.");
