import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = readDB();
  const crawledMap = new Map(db.crawledImages.map((c) => [c.id, c]));
  const enriched = db.moodboardImages.map((m) => {
    const crawled = crawledMap.get(m.crawledImageId);
    return {
      ...m,
      roomType: crawled?.roomType || "Uncategorised",
      style: crawled?.style || "Uncategorised",
    };
  });
  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const { crawledImageId, imageUrl } = await req.json();
  const db = readDB();

  // Check if already in moodboard
  if (db.moodboardImages.some((m) => m.crawledImageId === crawledImageId)) {
    return NextResponse.json(
      { error: "Already in moodboard" },
      { status: 400 }
    );
  }

  const entry = {
    id: uuidv4(),
    crawledImageId,
    imageUrl,
    comment: "",
    addedAt: new Date().toISOString(),
  };

  db.moodboardImages.push(entry);
  writeDB(db);

  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest) {
  const { id, comment } = await req.json();
  const db = readDB();

  const image = db.moodboardImages.find((m) => m.id === id);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  image.comment = comment;
  writeDB(db);

  return NextResponse.json(image);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const db = readDB();

  db.moodboardImages = db.moodboardImages.filter((m) => m.id !== id);
  writeDB(db);

  return NextResponse.json({ success: true });
}
