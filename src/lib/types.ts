export const ROOM_TYPES = [
  "Living Room",
  "Kitchen",
  "Bedroom",
  "Bathroom",
  "Dining Room",
  "Study",
  "Garden",
  "Balcony",
] as const;

export const STYLES = [
  "Japandi",
  "Scandinavian",
  "Minimalistic",
  "Modern",
  "Wabi-Sabi",
  "Transitional",
  "Eclectic",
  "Colourful",
  "Contemporary",
  "Industrial",
] as const;

export interface CrawledImage {
  id: string;
  sourceUrl: string;
  imageUrl: string;
  alt: string;
  roomType: string;
  style: string;
  crawledAt: string;
}

export interface MoodboardImage {
  id: string;
  crawledImageId: string;
  imageUrl: string;
  comment: string;
  addedAt: string;
  featured?: boolean;
}
