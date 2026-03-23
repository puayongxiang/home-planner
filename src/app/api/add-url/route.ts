import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { addCrawledImage, hasCrawledImageByImageUrlOrSourceUrl } from "@/lib/repository";


async function extractOgImage(url: string): Promise<{ imageUrl: string; title: string }> {
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

  const ogImageMatch = html.match(
    /<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i
  ) || html.match(
    /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i
  );

  const ogTitleMatch = html.match(
    /<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i
  ) || html.match(
    /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i
  );

  if (!ogImageMatch) {
    throw new Error("Could not find og:image in page");
  }

  return {
    imageUrl: ogImageMatch[1],
    title: ogTitleMatch ? ogTitleMatch[1] : "",
  };
}

export async function POST(req: NextRequest) {
  const { url, roomType, style } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // If it's a direct image URL, use it as-is
    const isDirectImage = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);
    let imageUrl: string;
    let title = "";
    if (isDirectImage) {
      imageUrl = url;
    } else {
      const extracted = await extractOgImage(url);
      imageUrl = extracted.imageUrl;
      title = extracted.title;
    }

    // Check if this image was already added
    if (await hasCrawledImageByImageUrlOrSourceUrl(imageUrl, url)) {
      return NextResponse.json(
        { error: "This image has already been added" },
        { status: 409 }
      );
    }

    const image = await addCrawledImage({
      id: uuidv4(),
      sourceUrl: url,
      imageUrl,
      alt: title,
      roomType: roomType || "Uncategorised",
      style: style || "Uncategorised",
      source: "Manual",
      crawledAt: new Date().toISOString(),
    });

    return NextResponse.json(image);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract image";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
