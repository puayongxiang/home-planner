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

export const SOURCES = [
  "Qanvast",
  "StackedHomes",
  "Hometrust",
  "URL Import",
  "Manual",
  "Instagram",
  "Xiaohongshu",
  "Social",
] as const;

export interface CrawledImage {
  id: string;
  sourceUrl: string;
  imageUrl: string;
  alt: string;
  roomType: string;
  style: string;
  source?: string;
  crawledAt: string;
}

export type DrawTool = "pen" | "circle" | "rect" | "highlight";

export interface Stroke {
  tool: DrawTool;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface MoodboardImage {
  id: string;
  crawledImageId: string;
  imageUrl: string;
  comment: string;
  addedAt: string;
  featured?: boolean;
  annotations?: Stroke[];
}

export interface FurnitureItem {
  id: string;
  name: string;
  imageUrl?: string;
  price?: string;
  link?: string;
  roomType?: string;
  notes?: string;
  addedAt: string;
}

export interface SavedLink {
  id: string;
  url: string;
  source: string;
  title?: string;
  note?: string;
  roomType?: string;
  style?: string;
  savedAt: string;
}
