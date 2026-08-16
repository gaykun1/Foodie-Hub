"use client";
import { Restaurant } from "@/redux/reduxTypes";
import axios from "axios";
import { ArrowRight, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
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

const Page = () => {
  const [items, setItems] = useState<Restaurant[]>();

  useEffect(() => {
    const getFavourites = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/favourites`, { withCredentials: true });
        setItems(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    getFavourites();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-ink">Favorite Restaurants</h1>
      {!items ? (
        <CardGridSkeleton count={3} item={FavouriteSkeleton} />
      ) : items.length > 0 ? (
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
        <EmptyState icon={<Heart size={22} />} title="No favorites yet" description="Tap the heart on any restaurant to save it here." />
      )}
    </div>
  );
};

export default Page;
