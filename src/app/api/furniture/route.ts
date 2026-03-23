import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireEditorUser } from "@/lib/auth";
import {
  createFurnitureItem,
  deleteFurnitureItem,
  listFurnitureItems,
  updateFurnitureItem,
} from "@/lib/repository";


export async function GET() {
  return NextResponse.json(await listFurnitureItems());
}

export async function POST(req: NextRequest) {
  const authResult = await requireEditorUser();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await req.json();
  const entry = await createFurnitureItem({
    id: uuidv4(),
    name: body.name || "Untitled",
    imageUrl: body.imageUrl || undefined,
    price: body.price || undefined,
    link: body.link || undefined,
    roomType: body.roomType || undefined,
    notes: body.notes || undefined,
  });
  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest) {
  const authResult = await requireEditorUser();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await req.json();
  const { id } = body;
  const item = await updateFurnitureItem(id, body);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireEditorUser();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await req.json();
  await deleteFurnitureItem(id);
  return NextResponse.json({ success: true });
}
