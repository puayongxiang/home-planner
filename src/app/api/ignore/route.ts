import { NextRequest, NextResponse } from "next/server";
import { addIgnoredId, listIgnoredIds, removeIgnoredId } from "@/lib/repository";


export async function GET() {
  return NextResponse.json(await listIgnoredIds());
}

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  await addIgnoredId(id);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await removeIgnoredId(id);

  return NextResponse.json({ success: true });
}
