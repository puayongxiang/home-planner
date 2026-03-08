import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB } from "@/lib/db";

export const dynamic = "force-dynamic";

const ROOM_KEYWORDS: Record<string, string> = {
  "living room": "Living Room",
  "bedroom": "Bedroom",
  "kitchen": "Kitchen",
  "bathroom": "Bathroom",
  "dining room": "Dining Room",
  "dining": "Dining Room",
  "study": "Study",
  "entryway": "Living Room",
  "foyer": "Living Room",
  "balcony": "Balcony",
  "garden": "Garden",
  "toilet": "Bathroom",
  "walkway": "Living Room",
  "corridor": "Living Room",
};

function parseRoomFromAlt(alt: string): string {
  const lower = alt.toLowerCase();
  for (const [keyword, room] of Object.entries(ROOM_KEYWORDS)) {
    if (lower.includes(keyword)) return room;
  }
  return "Uncategorised";
}

function parseStyleFromAlt(alt: string): string {
  const lower = alt.toLowerCase();
  const styles: Record<string, string> = {
    "japandi": "Japandi",
    "scandinavian": "Scandinavian",
    "minimalist": "Minimalistic",
    "minimalistic": "Minimalistic",
    "modern": "Modern",
    "wabi-sabi": "Wabi-Sabi",
    "transitional": "Transitional",
    "eclectic": "Eclectic",
    "contemporary": "Contemporary",
    "industrial": "Industrial",
    "asian": "Asian",
    "muji": "Japandi",
    "nordic": "Scandinavian",
    "tropical": "Tropical",
    "bohemian": "Eclectic",
    "rustic": "Rustic",
    "retro": "Retro",
    "mid-century": "Mid-Century",
  };
  for (const [keyword, style] of Object.entries(styles)) {
    if (lower.includes(keyword)) return style;
  }
  return "Uncategorised";
}

interface ScrapedImage {
  src: string;
  alt: string;
}

async function scrapeImages(url: string): Promise<ScrapedImage[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status}`);
  }

  const html = await res.text();
  const images: ScrapedImage[] = [];
  const seen = new Set<string>();

  // Match all <img> tags with src and alt
  const imgRegex = /<img\s+[^>]*?src=["']([^"']+)["'][^>]*?alt=["']([^"']*?)["'][^>]*?>/gi;
  const imgRegex2 = /<img\s+[^>]*?alt=["']([^"']*?)["'][^>]*?src=["']([^"']+)["'][^>]*?>/gi;

  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    const alt = match[2];
    if (!seen.has(src) && isProjectImage(src, url)) {
      seen.add(src);
      images.push({ src, alt });
    }
  }
  while ((match = imgRegex2.exec(html)) !== null) {
    const src = match[2];
    const alt = match[1];
    if (!seen.has(src) && isProjectImage(src, url)) {
      seen.add(src);
      images.push({ src, alt });
    }
  }

  // Also look for image URLs in JSON data embedded in script tags
  // Common pattern: "image_url":"https://..." or "src":"https://..."
  const jsonUrlRegex = /["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))["']/gi;
  while ((match = jsonUrlRegex.exec(html)) !== null) {
    const src = match[1];
    if (!seen.has(src) && isProjectImage(src, url)) {
      seen.add(src);
      images.push({ src, alt: "" });
    }
  }

  return images;
}

function isProjectImage(src: string, pageUrl: string): boolean {
  // Filter out tiny icons, logos, avatars
  if (src.includes("logo") || src.includes("icon") || src.includes("avatar")) return false;
  if (src.includes("checkmark") || src.includes("badge")) return false;
  if (src.endsWith(".svg") || src.endsWith(".gif")) return false;

  // Hometrust: project images are on S3 under /projects/
  if (pageUrl.includes("hometrust.sg")) {
    return src.includes("/projects/") && (src.endsWith(".jpg") || src.endsWith(".png") || src.endsWith(".jpeg") || src.endsWith(".webp"));
  }

  // Qanvast: images on their CDN
  if (pageUrl.includes("qanvast.com")) {
    return src.includes("qanvast") && (src.endsWith(".jpg") || src.endsWith(".png") || src.endsWith(".jpeg") || src.endsWith(".webp"));
  }

  // Generic: accept most image URLs that look like photos
  return (
    (src.startsWith("http://") || src.startsWith("https://")) &&
    (src.endsWith(".jpg") || src.endsWith(".jpeg") || src.endsWith(".png") || src.endsWith(".webp")) &&
    !src.includes("1x1") &&
    !src.includes("pixel")
  );
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const scraped = await scrapeImages(url);

    if (scraped.length === 0) {
      return NextResponse.json(
        { error: "No images found on this page. The site may load images dynamically." },
        { status: 422 }
      );
    }

    const db = readDB();
    const existingUrls = new Set(db.crawledImages.map((c) => c.imageUrl));
    let added = 0;

    for (const img of scraped) {
      if (existingUrls.has(img.src)) continue;

      const image = {
        id: uuidv4(),
        sourceUrl: url,
        imageUrl: img.src,
        alt: img.alt,
        roomType: parseRoomFromAlt(img.alt),
        style: parseStyleFromAlt(img.alt),
        crawledAt: new Date().toISOString(),
      };

      db.crawledImages.push(image);
      existingUrls.add(img.src);
      added++;
    }

    writeDB(db);

    return NextResponse.json({
      total: scraped.length,
      added,
      skipped: scraped.length - added,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to import images";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
