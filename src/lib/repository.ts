import {
  CrawledImage,
  FurnitureItem,
  MoodboardImage,
  SavedLink,
  Stroke,
} from "./types";

interface CreateMoodboardImageInput {
  id: string;
  crawledImageId: string;
  imageUrl: string;
  comment?: string;
  addedAt?: string;
  pinned?: boolean;
  annotations?: Stroke[];
}

interface UpdateMoodboardImageInput {
  comment?: string;
  pinned?: boolean;
  annotations?: Stroke[];
}

interface CreateFurnitureItemInput {
  id: string;
  name: string;
  imageUrl?: string;
  price?: string;
  link?: string;
  roomType?: string;
  notes?: string;
  pinned?: boolean;
  addedAt?: string;
}

interface UpdateFurnitureItemInput {
  name?: string;
  imageUrl?: string;
  price?: string;
  link?: string;
  roomType?: string;
  notes?: string;
  pinned?: boolean;
}

interface CreateSavedLinkInput {
  id: string;
  url: string;
  source: string;
  title?: string;
  note?: string;
  roomType?: string;
  style?: string;
  pinned?: boolean;
  savedAt?: string;
}

interface UpdateSavedLinkInput {
  title?: string;
  note?: string;
  roomType?: string;
  style?: string;
  pinned?: boolean;
}

interface EnrichedMoodboardImage extends MoodboardImage {
  roomType: string;
  style: string;
}

interface CrawledImageRow {
  id: string;
  source_url: string;
  image_url: string;
  alt: string;
  room_type: string;
  style: string;
  source: string | null;
  crawled_at: string;
}

interface MoodboardImageRow {
  id: string;
  crawled_image_id: string;
  image_url: string;
  comment: string;
  pinned: boolean;
  annotations: Stroke[] | null;
  added_at: string;
}

interface SavedLinkRow {
  id: string;
  url: string;
  source: string;
  title: string;
  note: string;
  room_type: string;
  style: string;
  pinned: boolean;
  saved_at: string;
}

interface FurnitureItemRow {
  id: string;
  name: string;
  image_url: string | null;
  price: string | null;
  link: string | null;
  room_type: string | null;
  notes: string | null;
  pinned: boolean;
  added_at: string;
}

interface IgnoredImageRow {
  crawled_image_id: string;
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

class DuplicateConstraintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateConstraintError";
  }
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getBaseUrl(): string {
  return requireEnv("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
}

function getServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
}

function buildUrl(table: string, params?: Record<string, string | undefined>): URL {
  const url = new URL(`/rest/v1/${table}`, getBaseUrl());
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

async function supabaseRequest<T>(
  method: string,
  table: string,
  options?: {
    params?: Record<string, string | undefined>;
    body?: unknown;
    prefer?: string;
    cache?: RequestCache;
  }
): Promise<T> {
  const response = await fetch(buildUrl(table, options?.params), {
    method,
    headers: {
      apikey: getServiceRoleKey(),
      Authorization: `Bearer ${getServiceRoleKey()}`,
      "Content-Type": "application/json",
      Prefer: options?.prefer || "return=representation",
    },
    cache: options?.cache || "no-store",
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const body = await response.text();
    let parsed: { code?: string; message?: string } | null = null;
    if (body) {
      try {
        parsed = JSON.parse(body) as { code?: string; message?: string };
      } catch {
        parsed = null;
      }
    }
    if (response.status === 409 || parsed?.code === "23505") {
      throw new DuplicateConstraintError(parsed?.message || `Duplicate row in ${table}`);
    }
    throw new Error(`Supabase ${method} ${table} failed: ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export function isDuplicateConstraintError(error: unknown): boolean {
  return error instanceof DuplicateConstraintError;
}

function mapCrawledImageRow(row: CrawledImageRow): CrawledImage {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    imageUrl: row.image_url,
    alt: row.alt,
    roomType: row.room_type,
    style: row.style,
    source: row.source || undefined,
    crawledAt: row.crawled_at,
  };
}

function mapMoodboardImageRow(row: MoodboardImageRow): MoodboardImage {
  return {
    id: row.id,
    crawledImageId: row.crawled_image_id,
    imageUrl: row.image_url,
    comment: row.comment,
    pinned: row.pinned,
    annotations: row.annotations || undefined,
    addedAt: row.added_at,
  };
}

function mapSavedLinkRow(row: SavedLinkRow): SavedLink {
  return {
    id: row.id,
    url: row.url,
    source: row.source,
    title: row.title,
    note: row.note,
    roomType: row.room_type,
    style: row.style,
    pinned: row.pinned,
    savedAt: row.saved_at,
  };
}

function mapFurnitureItemRow(row: FurnitureItemRow): FurnitureItem {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url || undefined,
    price: row.price || undefined,
    link: row.link || undefined,
    roomType: row.room_type || undefined,
    notes: row.notes || undefined,
    pinned: row.pinned,
    addedAt: row.added_at,
  };
}

function toCrawledImageRow(image: CrawledImage): CrawledImageRow {
  return {
    id: image.id,
    source_url: image.sourceUrl,
    image_url: image.imageUrl,
    alt: image.alt || "",
    room_type: image.roomType || "Uncategorised",
    style: image.style || "Uncategorised",
    source: image.source || null,
    crawled_at: image.crawledAt,
  };
}

export async function listCrawledImages(): Promise<CrawledImage[]> {
  const rows = await supabaseRequest<CrawledImageRow[]>("GET", "crawled_images", {
    params: {
      select: "*",
      order: "crawled_at.desc",
    },
    cache: "no-store",
  });

  return rows.map(mapCrawledImageRow);
}

export async function addCrawledImage(image: CrawledImage): Promise<CrawledImage> {
  const rows = await supabaseRequest<CrawledImageRow[]>("POST", "crawled_images", {
    body: toCrawledImageRow(image),
  });
  return mapCrawledImageRow(rows[0]);
}

export async function addCrawledImages(images: CrawledImage[]): Promise<CrawledImage[]> {
  if (images.length === 0) {
    return [];
  }

  const rows = await supabaseRequest<CrawledImageRow[]>("POST", "crawled_images", {
    body: images.map(toCrawledImageRow),
    prefer: "resolution=merge-duplicates,return=representation",
  });
  return rows.map(mapCrawledImageRow);
}

export async function hasCrawledImageByImageUrlOrSourceUrl(imageUrl: string, sourceUrl: string): Promise<boolean> {
  const byImage = await supabaseRequest<CrawledImageRow[]>("GET", "crawled_images", {
    params: {
      select: "id",
      image_url: `eq.${imageUrl}`,
      limit: "1",
    },
  });

  if (byImage.length > 0) {
    return true;
  }

  const bySource = await supabaseRequest<CrawledImageRow[]>("GET", "crawled_images", {
    params: {
      select: "id",
      source_url: `eq.${sourceUrl}`,
      limit: "1",
    },
  });

  return bySource.length > 0;
}

export async function updateCrawledImage(
  id: string,
  updates: { roomType?: string; style?: string }
): Promise<CrawledImage | null> {
  const payload: Record<string, string> = {};
  if (updates.roomType !== undefined) payload.room_type = updates.roomType;
  if (updates.style !== undefined) payload.style = updates.style;
  if (Object.keys(payload).length === 0) {
    const rows = await supabaseRequest<CrawledImageRow[]>("GET", "crawled_images", {
      params: { select: "*", id: `eq.${id}`, limit: "1" },
    });
    return rows[0] ? mapCrawledImageRow(rows[0]) : null;
  }

  const rows = await supabaseRequest<CrawledImageRow[]>("PATCH", "crawled_images", {
    params: { id: `eq.${id}` },
    body: payload,
  });

  return rows[0] ? mapCrawledImageRow(rows[0]) : null;
}

export async function clearCrawledWorkspace(): Promise<void> {
  await supabaseRequest<void>("DELETE", "moodboard_images", {
    params: { id: "not.is.null" },
    prefer: "return=minimal",
  });
  await supabaseRequest<void>("DELETE", "ignored_images", {
    params: { crawled_image_id: "not.is.null" },
    prefer: "return=minimal",
  });
  await supabaseRequest<void>("DELETE", "crawled_images", {
    params: { id: "not.is.null" },
    prefer: "return=minimal",
  });
}

export async function listIgnoredIds(): Promise<string[]> {
  const rows = await supabaseRequest<IgnoredImageRow[]>("GET", "ignored_images", {
    params: {
      select: "crawled_image_id",
      order: "created_at.desc",
    },
    cache: "no-store",
  });

  return rows.map((row) => row.crawled_image_id);
}

export async function addIgnoredId(id: string): Promise<boolean> {
  const rows = await supabaseRequest<IgnoredImageRow[]>("POST", "ignored_images", {
    body: { crawled_image_id: id },
    prefer: "resolution=merge-duplicates,return=representation",
  });
  return rows.length > 0;
}

export async function removeIgnoredId(id: string): Promise<boolean> {
  const rows = await supabaseRequest<IgnoredImageRow[]>("DELETE", "ignored_images", {
    params: {
      crawled_image_id: `eq.${id}`,
    },
  });
  return rows.length > 0;
}

export async function listFurnitureItems(): Promise<FurnitureItem[]> {
  const rows = await supabaseRequest<FurnitureItemRow[]>("GET", "furniture_items", {
    params: {
      select: "*",
      order: "added_at.desc",
    },
    cache: "no-store",
  });

  return rows.map(mapFurnitureItemRow);
}

export async function createFurnitureItem(input: CreateFurnitureItemInput): Promise<FurnitureItem> {
  const rows = await supabaseRequest<FurnitureItemRow[]>("POST", "furniture_items", {
    body: {
      id: input.id,
      name: input.name || "Untitled",
      image_url: input.imageUrl || null,
      price: input.price || null,
      link: input.link || null,
      room_type: input.roomType || null,
      notes: input.notes || null,
      pinned: input.pinned ?? false,
      added_at: input.addedAt || new Date().toISOString(),
    },
  });

  return mapFurnitureItemRow(rows[0]);
}

export async function updateFurnitureItem(
  id: string,
  updates: UpdateFurnitureItemInput
): Promise<FurnitureItem | null> {
  const payload: Record<string, string | boolean | null> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if ("imageUrl" in updates) payload.image_url = updates.imageUrl || null;
  if ("price" in updates) payload.price = updates.price || null;
  if ("link" in updates) payload.link = updates.link || null;
  if ("roomType" in updates) payload.room_type = updates.roomType || null;
  if ("notes" in updates) payload.notes = updates.notes || null;
  if (updates.pinned !== undefined) payload.pinned = updates.pinned;

  const rows = await supabaseRequest<FurnitureItemRow[]>("PATCH", "furniture_items", {
    params: { id: `eq.${id}` },
    body: payload,
  });

  return rows[0] ? mapFurnitureItemRow(rows[0]) : null;
}

export async function deleteFurnitureItem(id: string): Promise<boolean> {
  const rows = await supabaseRequest<FurnitureItemRow[]>("DELETE", "furniture_items", {
    params: { id: `eq.${id}` },
  });
  return rows.length > 0;
}

export async function listSavedLinks(): Promise<SavedLink[]> {
  const rows = await supabaseRequest<SavedLinkRow[]>("GET", "saved_links", {
    params: {
      select: "*",
      order: "saved_at.desc",
    },
    cache: "no-store",
  });

  return rows.map(mapSavedLinkRow);
}

export async function hasSavedLinkByUrl(url: string): Promise<boolean> {
  const rows = await supabaseRequest<SavedLinkRow[]>("GET", "saved_links", {
    params: {
      select: "id",
      url: `eq.${url}`,
      limit: "1",
    },
  });
  return rows.length > 0;
}

export async function createSavedLink(input: CreateSavedLinkInput): Promise<SavedLink> {
  const rows = await supabaseRequest<SavedLinkRow[]>("POST", "saved_links", {
    body: {
      id: input.id,
      url: input.url,
      source: input.source,
      title: input.title || "",
      note: input.note || "",
      room_type: input.roomType || "",
      style: input.style || "",
      pinned: input.pinned ?? false,
      saved_at: input.savedAt || new Date().toISOString(),
    },
  });

  return mapSavedLinkRow(rows[0]);
}

export async function updateSavedLink(id: string, updates: UpdateSavedLinkInput): Promise<SavedLink | null> {
  const payload: Record<string, string | boolean> = {};
  if ("title" in updates && updates.title !== undefined) payload.title = updates.title;
  if ("note" in updates && updates.note !== undefined) payload.note = updates.note;
  if ("roomType" in updates && updates.roomType !== undefined) payload.room_type = updates.roomType;
  if ("style" in updates && updates.style !== undefined) payload.style = updates.style;
  if (updates.pinned !== undefined) payload.pinned = updates.pinned;

  const rows = await supabaseRequest<SavedLinkRow[]>("PATCH", "saved_links", {
    params: { id: `eq.${id}` },
    body: payload,
  });

  return rows[0] ? mapSavedLinkRow(rows[0]) : null;
}

export async function deleteSavedLink(id: string): Promise<boolean> {
  const rows = await supabaseRequest<SavedLinkRow[]>("DELETE", "saved_links", {
    params: { id: `eq.${id}` },
  });
  return rows.length > 0;
}

export async function listEnrichedMoodboardImages(): Promise<EnrichedMoodboardImage[]> {
  const [moodboardRows, crawledRows] = await Promise.all([
    supabaseRequest<MoodboardImageRow[]>("GET", "moodboard_images", {
      params: {
        select: "*",
        order: "added_at.desc",
      },
      cache: "no-store",
    }),
    supabaseRequest<CrawledImageRow[]>("GET", "crawled_images", {
      params: {
        select: "id,room_type,style",
      },
      cache: "no-store",
    }),
  ]);

  const crawledMap = new Map(crawledRows.map((row) => [row.id, row]));
  return moodboardRows.map((row) => {
    const image = mapMoodboardImageRow(row);
    const crawled = crawledMap.get(row.crawled_image_id);
    return {
      ...image,
      roomType: crawled?.room_type || "Uncategorised",
      style: crawled?.style || "Uncategorised",
    };
  });
}

export async function hasMoodboardImageForCrawledImage(crawledImageId: string): Promise<boolean> {
  const rows = await supabaseRequest<MoodboardImageRow[]>("GET", "moodboard_images", {
    params: {
      select: "id",
      crawled_image_id: `eq.${crawledImageId}`,
      limit: "1",
    },
  });
  return rows.length > 0;
}

export async function createMoodboardImage(input: CreateMoodboardImageInput): Promise<MoodboardImage> {
  const rows = await supabaseRequest<MoodboardImageRow[]>("POST", "moodboard_images", {
    body: {
      id: input.id,
      crawled_image_id: input.crawledImageId,
      image_url: input.imageUrl,
      comment: input.comment || "",
      pinned: input.pinned ?? false,
      annotations: input.annotations || null,
      added_at: input.addedAt || new Date().toISOString(),
    },
  });

  return mapMoodboardImageRow(rows[0]);
}

export async function updateMoodboardImage(
  id: string,
  updates: UpdateMoodboardImageInput
): Promise<MoodboardImage | null> {
  const payload: Record<string, string | boolean | Stroke[] | null> = {};
  if (updates.comment !== undefined) payload.comment = updates.comment;
  if (updates.pinned !== undefined) payload.pinned = updates.pinned;
  if ("annotations" in updates) payload.annotations = updates.annotations || null;

  const rows = await supabaseRequest<MoodboardImageRow[]>("PATCH", "moodboard_images", {
    params: { id: `eq.${id}` },
    body: payload,
  });

  return rows[0] ? mapMoodboardImageRow(rows[0]) : null;
}

export async function deleteMoodboardImage(id: string): Promise<boolean> {
  const rows = await supabaseRequest<MoodboardImageRow[]>("DELETE", "moodboard_images", {
    params: { id: `eq.${id}` },
  });
  return rows.length > 0;
}

export async function getHomePageData(): Promise<{
  images: EnrichedMoodboardImage[];
  savedLinks: SavedLink[];
  furnitureItems: FurnitureItem[];
}> {
  const [images, savedLinks, furnitureItems] = await Promise.all([
    listEnrichedMoodboardImages(),
    listSavedLinks(),
    listFurnitureItems(),
  ]);

  return {
    images,
    savedLinks,
    furnitureItems,
  };
}

export type { CrawledImage, FurnitureItem, MoodboardImage, SavedLink } from "./types";
