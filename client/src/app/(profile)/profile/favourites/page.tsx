"use client";
import { Restaurant } from "@/redux/reduxTypes";
import { restaurantsApi } from "@/api";
import { isNotFound } from "@/lib/apiClient";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ArrowRight, Heart, TriangleAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CardGridSkeleton } from "@/components/ui/Skeleton";

const FavouriteSkeleton = () => (
  <div className="flex gap-4 border border-border p-4 rounded-lg">
    <div className="size-20 rounded-md bg-skeleton animate-pulse shrink-0" />
    <div className="flex flex-col justify-between gap-2 flex-1">
      <div className="h-5 w-2/3 bg-skeleton animate-pulse rounded" />
      <div className="h-9 w-40 bg-skeleton animate-pulse rounded" />
    </div>
  </div>
);

const FavouritesView = () => {
  const [items, setItems] = useState<Restaurant[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      setItems(await restaurantsApi.getFavouriteRestaurants());
    } catch (err) {
      // "No favourites yet" comes back as a 404 — an empty state, not a failure.
      if (isNotFound(err)) {
        setItems([]);
      } else {
        console.error(err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-ink">Favorite Restaurants</h1>
      {loading ? (
        <CardGridSkeleton count={3} item={FavouriteSkeleton} />
      ) : error ? (
        <EmptyState
          icon={<TriangleAlert size={22} />}
          title="Couldn't load your favorites"
          description="Nothing has been removed — the request just didn't get through."
          action={<Button onClick={load}>Try again</Button>}
        />
      ) : items && items.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item._id} padding="sm" className="flex gap-4">
              <div className="relative size-20 shrink-0 rounded-md overflow-hidden border border-border bg-sand-100">
                <Image src={item.imageUrl} alt={item.title} fill sizes="80px" className="object-cover" />
              </div>
              <div className="flex flex-col justify-between gap-2 min-w-0">
                <h3 className="text-lg leading-6 font-semibold text-ink truncate">{item.title}</h3>
                <Link href={`/restaurant/menu/${item._id}`} className="btn py-2 h-9 flex items-center gap-1 w-fit">
                  <span>View restaurant</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Heart size={22} />}
          title="No favorites yet"
          description="Tap the heart on any restaurant to save it here."
          action={<ButtonLink href="/restaurants/category/all-restaurants">Browse restaurants</ButtonLink>}
        />
      )}
    </div>
  );
};

const Page = () => (
  <RequireAuth
    title="Sign in to see your favorites"
    description="Favorites are saved to your account. You can browse every restaurant without one."
  >
    <FavouritesView />
  </RequireAuth>
);

export default Page;
