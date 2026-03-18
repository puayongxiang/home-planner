import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB } from "@/lib/db";


export async function GET() {
  const db = readDB();
  const sorted = [...db.furnitureItems].sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = readDB();

  const entry = {
    id: uuidv4(),
    name: body.name || "Untitled",
    imageUrl: body.imageUrl || undefined,
    price: body.price || undefined,
    link: body.link || undefined,
    roomType: body.roomType || undefined,
    notes: body.notes || undefined,
    addedAt: new Date().toISOString(),
  };

  db.furnitureItems.push(entry);
  writeDB(db);
  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id } = body;
  const db = readDB();

  const item = db.furnitureItems.find((f) => f.id === id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if ("name" in body) item.name = body.name;
  if ("imageUrl" in body) item.imageUrl = body.imageUrl;
  if ("price" in body) item.price = body.price;
  if ("link" in body) item.link = body.link;
  if ("roomType" in body) item.roomType = body.roomType;
  if ("notes" in body) item.notes = body.notes;
  if ("pinned" in body) item.pinned = body.pinned;
  writeDB(db);

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const db = readDB();
  db.furnitureItems = db.furnitureItems.filter((f) => f.id !== id);
  writeDB(db);
  return NextResponse.json({ success: true });
}
