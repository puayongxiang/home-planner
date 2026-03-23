import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  createMoodboardImage,
  deleteMoodboardImage,
  hasMoodboardImageForCrawledImage,
  listEnrichedMoodboardImages,
  updateMoodboardImage,
} from "@/lib/repository";


export async function GET() {
  return NextResponse.json(await listEnrichedMoodboardImages());
}

export async function POST(req: NextRequest) {
  const { crawledImageId, imageUrl } = await req.json();
  // Check if already in moodboard
  if (await hasMoodboardImageForCrawledImage(crawledImageId)) {
    return NextResponse.json(
      { error: "Already in moodboard" },
      { status: 400 }
    );
  }

  const entry = await createMoodboardImage({
    id: uuidv4(),
    crawledImageId,
    imageUrl,
  });

  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id } = body;
  const image = await updateMoodboardImage(id, body);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(image);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await deleteMoodboardImage(id);

  return NextResponse.json({ success: true });
}
