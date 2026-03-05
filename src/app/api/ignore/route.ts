import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";

export async function GET() {
  const db = readDB();
  return NextResponse.json(db.ignoredIds);
}

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  const db = readDB();

  if (!db.ignoredIds.includes(id)) {
    db.ignoredIds.push(id);
    writeDB(db);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const db = readDB();

  db.ignoredIds = db.ignoredIds.filter((i) => i !== id);
  writeDB(db);

  return NextResponse.json({ success: true });
}
