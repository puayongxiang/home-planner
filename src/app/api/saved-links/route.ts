import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB } from "@/lib/db";

function detectSource(url: string): string {
  if (/instagram\.com/i.test(url)) return "Instagram";
  if (/xiaohongshu\.com|xhslink\.com/i.test(url)) return "Xiaohongshu";
  if (/pinterest\.com/i.test(url)) return "Pinterest";
  if (/tiktok\.com/i.test(url)) return "TikTok";
  return "Other";
}

export async function GET() {
  const db = readDB();
  const sorted = [...db.savedLinks].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, title, note, roomType, style } = body;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const db = readDB();

  // Check for duplicate
  if (db.savedLinks.some((l) => l.url === url)) {
    return NextResponse.json({ error: "This link is already saved" }, { status: 409 });
  }

  const link = {
    id: uuidv4(),
    url,
    source: detectSource(url),
    title: title || "",
    note: note || "",
    roomType: roomType || "",
    style: style || "",
    savedAt: new Date().toISOString(),
  };

  db.savedLinks.push(link);
  writeDB(db);

  return NextResponse.json(link);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  const db = readDB();
  const link = db.savedLinks.find((l) => l.id === id);
  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if ("title" in updates) link.title = updates.title;
  if ("note" in updates) link.note = updates.note;
  if ("roomType" in updates) link.roomType = updates.roomType;
  if ("style" in updates) link.style = updates.style;

  writeDB(db);
  return NextResponse.json(link);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const db = readDB();
  db.savedLinks = db.savedLinks.filter((l) => l.id !== id);
  writeDB(db);
  return NextResponse.json({ success: true });
}
