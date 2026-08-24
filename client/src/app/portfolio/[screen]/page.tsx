import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FoodieHubShowcase, foodieHubScreens, type FoodieHubScreen } from "@/components/portfolio/FoodieHubShowcase";

export const metadata: Metadata = { title: "Product showcase", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return foodieHubScreens.map((screen) => ({ screen }));
}

export default async function PortfolioScreen({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params;
  if (!foodieHubScreens.includes(screen as FoodieHubScreen)) notFound();
  return <FoodieHubShowcase screen={screen as FoodieHubScreen}/>;
}
