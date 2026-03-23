import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireEditorUser } from "@/lib/auth";
import {
  addCrawledImage,
  createMoodboardImage,
  hasCrawledImageByImageUrlOrSourceUrl,
  isDuplicateConstraintError,
} from "@/lib/repository";

export async function POST(req: NextRequest) {
  const authResult = await requireEditorUser();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { imageUrl, roomType, style, alt } = await req.json();

  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  const normalizedRoomType = typeof roomType === "string" && roomType ? roomType : "Uncategorised";
  const normalizedStyle = typeof style === "string" && style ? style : "Uncategorised";
  const normalizedAlt = typeof alt === "string" ? alt : "";

  try {
    if (await hasCrawledImageByImageUrlOrSourceUrl(imageUrl, imageUrl)) {
      return NextResponse.json({ error: "This image has already been added" }, { status: 409 });
    }

    const crawledImage = await addCrawledImage({
      id: uuidv4(),
      sourceUrl: imageUrl,
      imageUrl,
      alt: normalizedAlt,
      roomType: normalizedRoomType,
      style: normalizedStyle,
      source: "Upload",
      crawledAt: new Date().toISOString(),
    });

    const moodboardImage = await createMoodboardImage({
      id: uuidv4(),
      crawledImageId: crawledImage.id,
      imageUrl: crawledImage.imageUrl,
    });

    return NextResponse.json({ crawledImage, moodboardImage });
  } catch (error) {
    if (isDuplicateConstraintError(error)) {
      return NextResponse.json({ error: "This image has already been added" }, { status: 409 });
    }

    throw error;
  }
}
