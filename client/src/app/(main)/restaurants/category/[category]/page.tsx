"use client"
import { restaurantsApi } from "@/api";
import { isNotFound } from "@/lib/apiClient";
import RestaurantCard from "@/components/mainPage/RestaurantCard";
import { Category, Restaurant } from "@/redux/reduxTypes";
import { SlidersHorizontal, Store, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDisclosure } from "@/hooks/useDisclosure";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const links: Record<Category, string> = {
  [Category.All]: "all-restaurants",
  [Category.FastFood]: "fast-food",
  [Category.Desserts]: "desserts",
  [Category.FineDining]: "finedining",
  [Category.Healthy]: "healthy",
};

export default function Page() {
  // Local state rather than the shared redux `restaurants` slice: that slice
  // is also written by the home page's category widget, and reading it here
  // meant switching to a category with zero matches (a 404, not an error —
  // see restaurantsApi.getRestaurantsFiltered) left whatever the *previous*
  // category had fetched on screen, with the heading changed but the grid
  // silently stale. It also initialized to `null`, which the old
  // `restaurants === undefined` loading check could never match, so the page
  // flashed "No restaurants found" before the first fetch had even resolved.
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const { category } = useParams() as { category: string };
  const filterMenu = useDisclosure();
  const filterWrapperRef = useRef<HTMLDivElement>(null);
  const entry = Object.entries(links).find(([, val]) => val === category);
  const currentTitle = entry ? entry[0] as Category : Category.All;

  const fetchRestaurants = useCallback(async (categoryTitle: Category) => {
    try {
      setLoading(true);
      setError(false);
      setRestaurants(await restaurantsApi.getRestaurantsFiltered(categoryTitle));
    } catch (err) {
      // No restaurant in this category is a normal empty state, not a failure.
      if (isNotFound(err)) {
        setRestaurants([]);
      } else {
        console.error(err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [])

  useEffect(() => {
    void fetchRestaurants(currentTitle);
  }, [currentTitle, fetchRestaurants])

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
                href={`/restaurants/category/${value}`}
                onClick={filterMenu.close}
                role="menuitem"
                aria-current={key === currentTitle ? "true" : undefined}
                className={cn(
                  "w-full flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  key === currentTitle ? "bg-ember-50 text-brand" : "text-ink hover:bg-surfaceRaised"
                )}
              >
                {key}
              </Link>
            ))}
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={8} />
      ) : error ? (
        <EmptyState
          icon={<TriangleAlert size={22} />}
          title="Couldn't load restaurants"
          description="The request didn't get through. Try again in a moment."
          action={<Button onClick={() => fetchRestaurants(currentTitle)}>Try again</Button>}
        />
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
