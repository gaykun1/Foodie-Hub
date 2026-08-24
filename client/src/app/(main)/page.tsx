import type { Metadata } from "next";
import Banner from "@/components/mainPage/Banner";
import Discount from "@/components/mainPage/Discount";
import DishesNearYou from "@/components/mainPage/DishesNearYou";
import ExperienceStrip from "@/components/mainPage/ExperienceStrip";
import RestaurantsByCategory from "@/components/mainPage/RestaurantsByCategory";

export const metadata: Metadata = {
  title: "FoodieHub — Discover, order, and track local food",
  description: "Discover local restaurants, check out securely, and follow your delivery live from kitchen to door.",
};

export default function Home() {
  return (
    <div>
      <Banner />
      <ExperienceStrip />
      <RestaurantsByCategory />
      <Discount />
      <DishesNearYou />
    </div>
  );
}
