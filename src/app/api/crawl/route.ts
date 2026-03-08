import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB, CrawledImage } from "@/lib/db";

export const dynamic = "force-dynamic";

const BASE_URL = "https://qanvast.com/sg/interior-design-singapore";

interface CrawledEntry {
  src: string;
  alt: string;
}

async function crawlPage(
  url: string,
  scrollCount: number
): Promise<CrawledEntry[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

  for (let i = 0; i < scrollCount; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise((r) => setTimeout(r, 1500));

    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const viewMore = buttons.find((b) =>
          b.textContent?.includes("View More")
        );
        if (viewMore) viewMore.click();
      });
    } catch {
      // No button found
    }
  }

  const rawEntries = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .map((img) => ({
        src: img.src || img.getAttribute("data-src") || "",
        alt: img.alt || "",
      }))
      .filter((e) => e.src.includes("cloudfront.net/image/"))
      .filter((e) => {
        const widthMatch = e.src.match(/(\d+)-width/);
        if (widthMatch) return parseInt(widthMatch[1]) >= 400;
        return true;
      })
      .filter((e) => {
        const lower = e.alt.toLowerCase();
        return !lower.includes("floorplan") && !lower.includes("floor plan");
      });
  });

  await browser.close();

  // Deduplicate by src and upgrade to larger size
  const seen = new Set<string>();
  const results: CrawledEntry[] = [];
  for (const entry of rawEntries) {
    const upgraded = entry.src.replace(/\/\d+-width$/, "/1024-width");
    if (!seen.has(upgraded)) {
      seen.add(upgraded);
      results.push({ src: upgraded, alt: entry.alt });
    }
  }
  return results;
}

export async function POST(req: NextRequest) {
  const { styles, roomTypes, scrollCount = 5 } = await req.json();

  if (
    (!styles || styles.length === 0) &&
    (!roomTypes || roomTypes.length === 0)
  ) {
    return NextResponse.json(
      { error: "Select at least one style or room type" },
      { status: 400 }
    );
  }

  const rooms: string[] = roomTypes || [];
  const styleParam = (styles || []).join(",");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const db = readDB();
        let totalNew = 0;
        let totalFound = 0;

        for (let i = 0; i < rooms.length; i++) {
          const room = rooms[i];

          // Send progress event - starting room
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "progress", room, current: i, total: rooms.length })}\n\n`
            )
          );

          const params = new URLSearchParams();
          if (styleParam) params.set("style", styleParam);
          params.set("roomType", room);

          const url = `${BASE_URL}?${params.toString()}`;
          const entries = await crawlPage(url, scrollCount);
          totalFound += entries.length;

          const newImages: CrawledImage[] = entries
            .filter(
              (e) => !db.crawledImages.some((c) => c.imageUrl === e.src)
            )
            .map((e) => ({
              id: uuidv4(),
              sourceUrl: url,
              imageUrl: e.src,
              alt: e.alt,
              roomType: room,
              style: styleParam,
              crawledAt: new Date().toISOString(),
            }));

          totalNew += newImages.length;
          db.crawledImages.push(...newImages);

          // Send room complete with images found
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "room_done", room, current: i + 1, total: rooms.length, images: newImages, found: entries.length, newCount: newImages.length })}\n\n`
            )
          );
        }

        writeDB(db);

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", total: totalFound, new: totalNew, roomsCrawled: rooms.length })}\n\n`
          )
        );
      } catch (error) {
        console.error("Crawl error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: "Failed to crawl" })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function GET() {
  const db = readDB();
  return NextResponse.json(db.crawledImages);
}

export async function DELETE() {
  const db = readDB();
  db.crawledImages = [];
  db.moodboardImages = [];
  db.ignoredIds = [];
  writeDB(db);
  return NextResponse.json({ success: true });
}
