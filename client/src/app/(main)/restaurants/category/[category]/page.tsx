"use client"
import { getRestaurantsFiltered } from "@/api/api";
import RestaurantCard from "@/components/mainPage/RestaurantCard";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { Category } from "@/redux/reduxTypes";
import { getRestaurants } from "@/redux/restaurantSlice";
import { SlidersHorizontal, Store } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useDisclosure } from "@/hooks/useDisclosure";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";

const links: Record<Category, string> = {
  [Category.All]: "all-restaurants",
  [Category.FastFood]: "fast-food",
  [Category.Desserts]: "desserts",
  [Category.FineDining]: "finedining",
  [Category.Healthy]: "healthy",
};

export default function Page() {
  const dispatch = useAppDispatch();
  const { restaurants } = useAppSelector(state => state.restaurants);
  const { category } = useParams() as { category: string };
  const filterMenu = useDisclosure();
  const filterWrapperRef = useRef<HTMLDivElement>(null);
  const entry = Object.entries(links).find(([, val]) => val === category);
  const currentTitle = entry ? entry[0] : Category.All;

  const fetchRestaurants = useCallback(async (category: string) => {
    try {
      const info = await getRestaurantsFiltered(category);
      if (info) dispatch(getRestaurants(info));
    } catch (err) {
      console.error(err);
    }
  }, [dispatch])

  useEffect(() => {
    fetchRestaurants(currentTitle);
  }, [currentTitle, fetchRestaurants])

  const isLoading = restaurants === undefined;

  return (
    <section className="mx-5 my-10 border border-border rounded-lg sm:p-8 p-6">
      <div className="border-b border-border mb-6 pb-4 flex justify-between gap-4 items-center">
        <h1 className="section-title">{currentTitle}</h1>
        <div ref={filterWrapperRef} className="relative">
          <button
            onClick={filterMenu.toggle}
            aria-expanded={filterMenu.isOpen}
            aria-haspopup="menu"
            className={cn(
              "text-lg flex items-center gap-2 cursor-pointer transition-colors",
              filterMenu.isOpen ? "text-brand" : "text-ink hover:text-brand"
            )}
          >
            <span className="font-semibold hidden sm:block">Filter</span>
            <SlidersHorizontal className={cn("transition-transform", filterMenu.isOpen && "rotate-90")} size={18} />
          </button>
          <DropdownMenu open={filterMenu.isOpen} onClose={filterMenu.close} anchorRef={filterWrapperRef} align="right" className="w-[200px]">
            {Object.entries(links).map(([key, value]) => (
              <Link
                key={value}
                href={value}
                onClick={filterMenu.close}
                role="menuitem"
                className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm font-medium text-ink hover:bg-surfaceRaised transition-colors"
              >
                {key}
              </Link>
            ))}
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={8} />
      ) : restaurants && restaurants.length > 0 ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant._id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Store size={22} />} title="No restaurants found" description="Try a different category." />
      )}
    </section>
  );
}
