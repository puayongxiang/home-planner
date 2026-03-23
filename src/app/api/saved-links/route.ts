import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  createSavedLink,
  deleteSavedLink,
  hasSavedLinkByUrl,
  listSavedLinks,
  updateSavedLink,
} from "@/lib/repository";

function detectSource(url: string): string {
  if (/instagram\.com/i.test(url)) return "Instagram";
  if (/xiaohongshu\.com|xhslink\.com/i.test(url)) return "Xiaohongshu";
  if (/pinterest\.com/i.test(url)) return "Pinterest";
  if (/tiktok\.com/i.test(url)) return "TikTok";
  return "Other";
}

export async function GET() {
  return NextResponse.json(await listSavedLinks());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, title, note, roomType, style } = body;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Check for duplicate
  if (await hasSavedLinkByUrl(url)) {
    return NextResponse.json({ error: "This link is already saved" }, { status: 409 });
  }

  const link = await createSavedLink({
    id: uuidv4(),
    url,
    source: detectSource(url),
    title: title || "",
    note: note || "",
    roomType: roomType || "",
    style: style || "",
  });

  return NextResponse.json(link);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  const link = await updateSavedLink(id, updates);
  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(link);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await deleteSavedLink(id);
  return NextResponse.json({ success: true });
}
