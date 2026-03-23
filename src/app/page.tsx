import MoodboardGallery from "@/components/MoodboardGallery";
import { getHomePageData } from "@/lib/repository";

export default async function Home() {
  const { images, savedLinks, furnitureItems } = await getHomePageData();
  return <MoodboardGallery initialImages={images} initialLinks={savedLinks} initialFurniture={furnitureItems} />;
}
