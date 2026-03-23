import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { addCrawledImages, listCrawledImages } from "@/lib/repository";


const BASE_URL = "https://stackedhomes.com/category/home-tours";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface ArticleLink {
  url: string;
  title: string;
}

interface ScrapedImage {
  src: string;
  alt: string;
}

async function fetchHTML(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function extractArticleLinks(html: string): ArticleLink[] {
  const links: ArticleLink[] = [];
  const seen = new Set<string>();

  // The main article grid has class "article-grid article-grid-full"
  // Sidebar/dropdown widgets use "dropdown-grid" or "dropdown-grid-full" as parent
  // We target the article-grid-full container to get only the main listing articles
  const gridMatch = html.match(
    /<div[^>]*class="[^"]*article-grid\s+article-grid-full[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*(?:sidebar|upgrade-to-pro|footer)[^"]*"|<footer)/i
  );

  const searchArea = gridMatch ? gridMatch[1] : "";
  if (!searchArea) return links;

  const linkRegex =
    /<h3[^>]*>\s*<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(searchArea)) !== null) {
    const url = match[1];
    const title = match[2].trim();
    if (
      !seen.has(url) &&
      url.includes("stackedhomes.com/") &&
      !url.includes("/category/")
    ) {
      seen.add(url);
      links.push({ url, title });
    }
  }

  return links;
}

function extractArticleImages(html: string): ScrapedImage[] {
  const images: ScrapedImage[] = [];
  const seen = new Set<string>();

  // Only match <img> tags inside <figure> elements — these are the actual content photos
  // Use a two-step approach: find all <figure> blocks, then extract img from each
  const figureRegex = /<figure[^>]*>([\s\S]*?)<\/figure>/gi;
  let figureMatch;
  while ((figureMatch = figureRegex.exec(html)) !== null) {
    const figureContent = figureMatch[1];

    // Extract img src and alt from within the figure
    const imgMatch = figureContent.match(
      /<img\s+[^>]*?src=["']([^"']+)["'][^>]*?alt=["']([^"']*?)["'][^>]*?>/i
    ) || figureContent.match(
      /<img\s+[^>]*?alt=["']([^"']*?)["'][^>]*?src=["']([^"']+)["'][^>]*?>/i
    );

    if (!imgMatch) continue;

    // Determine which capture group is src vs alt based on which regex matched
    const hasSrcFirst = imgMatch[0].indexOf('src=') < imgMatch[0].indexOf('alt=');
    const src = hasSrcFirst ? imgMatch[1] : imgMatch[2];
    const alt = hasSrcFirst ? imgMatch[2] : imgMatch[1];

    if (!seen.has(src) && isContentImage(src)) {
      seen.add(src);
      images.push({ src, alt });
    }
  }

  return images;
}

function isContentImage(src: string): boolean {
  // Must be from their CDN
  if (!src.includes("digitaloceanspaces.com")) return false;
  // Skip logos, icons, small assets
  if (src.includes("logo") || src.includes("icon") || src.includes("avatar"))
    return false;
  // Must be an image file
  if (
    !src.match(/\.(jpg|jpeg|png|webp)/i)
  )
    return false;
  // Skip very small sized variants (thumbnails)
  const sizeMatch = src.match(/(\d+)x(\d+)\./);
  if (sizeMatch && parseInt(sizeMatch[1]) < 400) return false;
  return true;
}

function parseStyleFromTitle(title: string): string {
  const lower = title.toLowerCase();
  const styles: Record<string, string> = {
    japandi: "Japandi",
    "japanese": "Japandi",
    scandinavian: "Scandinavian",
    nordic: "Scandinavian",
    minimalist: "Minimalistic",
    minimalistic: "Minimalistic",
    modern: "Modern",
    "wabi-sabi": "Wabi-Sabi",
    "wabi sabi": "Wabi-Sabi",
    industrial: "Industrial",
    brutalist: "Industrial",
    eclectic: "Eclectic",
    bohemian: "Eclectic",
    contemporary: "Contemporary",
    "mid-century": "Contemporary",
    colourful: "Colourful",
    colorful: "Colourful",
    vibrant: "Colourful",
    rustic: "Transitional",
    transitional: "Transitional",
    tropical: "Modern",
    "nature-inspired": "Japandi",
    earthy: "Japandi",
    cabin: "Transitional",
    monochrome: "Minimalistic",
  };
  for (const [keyword, style] of Object.entries(styles)) {
    if (lower.includes(keyword)) return style;
  }
  return "Uncategorised";
}

export async function POST(req: NextRequest) {
  const { startPage = 1, endPage = 5 } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const existingUrls = new Set((await listCrawledImages()).map((image) => image.imageUrl));
        let totalNew = 0;
        let totalFound = 0;
        const totalPages = endPage - startPage + 1;

        for (let page = startPage; page <= endPage; page++) {
          const pageUrl =
            page === 1 ? `${BASE_URL}/` : `${BASE_URL}/page/${page}/`;

          // Send progress: fetching listing page
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "progress",
                phase: "listing",
                page,
                totalPages,
                message: `Fetching listing page ${page}...`,
              })}\n\n`
            )
          );

          let html: string;
          try {
            html = await fetchHTML(pageUrl);
          } catch {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "page_error",
                  page,
                  message: `Failed to fetch page ${page}`,
                })}\n\n`
              )
            );
            continue;
          }

          const articles = extractArticleLinks(html);

          // Crawl each article on this listing page
          for (let a = 0; a < articles.length; a++) {
            const article = articles[a];

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "progress",
                  phase: "article",
                  page,
                  totalPages,
                  articleIndex: a,
                  articleCount: articles.length,
                  title: article.title,
                  message: `Page ${page}: Crawling "${article.title}" (${a + 1}/${articles.length})`,
                })}\n\n`
              )
            );

            let articleHtml: string;
            try {
              articleHtml = await fetchHTML(article.url);
            } catch {
              continue;
            }

            const images = extractArticleImages(articleHtml);
            totalFound += images.length;

            const style = parseStyleFromTitle(article.title);
            const newImages = images
              .filter((img) => !existingUrls.has(img.src))
              .map((img) => ({
                id: uuidv4(),
                sourceUrl: article.url,
                imageUrl: img.src,
                alt: img.alt || article.title,
                roomType: "Uncategorised",
                style,
                source: "StackedHomes",
                crawledAt: new Date().toISOString(),
              }));

            for (const img of newImages) {
              existingUrls.add(img.imageUrl);
            }
            totalNew += newImages.length;
            await addCrawledImages(newImages);

            // Send article done event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "article_done",
                  page,
                  title: article.title,
                  found: images.length,
                  newCount: newImages.length,
                  images: newImages,
                })}\n\n`
              )
            );

            // Small delay to be respectful
            await new Promise((r) => setTimeout(r, 300));
          }
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "done",
              totalFound,
              totalNew,
              pagesCrawled: totalPages,
            })}\n\n`
          )
        );
      } catch (error) {
        console.error("StackedHomes crawl error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: "Failed to crawl StackedHomes",
            })}\n\n`
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
