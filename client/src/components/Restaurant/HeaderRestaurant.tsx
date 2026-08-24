"use client"
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { updateFavourites } from "@/redux/authSlice";
import { Restaurant } from "@/redux/reduxTypes";
import { restaurantsApi } from "@/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Clock, Globe, Heart, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react"
import { Rating } from "@/components/ui/Rating";
import { TabList, TabLink } from "@/components/ui/Tabs";
import { PageSpinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

export default function HeaderRestaurant() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { id } = useParams() as { id: string };
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const path = usePathname();
  const { ensureAuth } = useRequireAuth();

  useEffect(() => {
    const getRestaurantInfo = async () => {
      try {
        setIsLoading(true);
        // Public: a visitor can read any restaurant's header without an account.
        setCurrentRestaurant(await restaurantsApi.getRestaurantById(id));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    getRestaurantInfo();
  }, [id])

  // Saving a favourite is tied to an account, so this is one of the few actions
  // that prompts for sign-in rather than proceeding.
  const toggleFavourite = () => {
    ensureAuth(async () => {
      try {
        dispatch(updateFavourites(await restaurantsApi.toggleFavourite(id)));
      } catch (err) {
        console.error(err);
        toast.error("Couldn't update favorites. Please try again.");
      }
    });
  }

  const links: Record<string, string> = {
    Menu: `/restaurant/menu/${id}`,
    About: `/restaurant/about/${id}`,
    Reviews: `/restaurant/reviews/${id}`,
  }

  if (isLoading) return <PageSpinner />;
  if (!currentRestaurant) return null;

  const isFavourite = !!user?.favourites?.includes(id);

  return (
    <div>
      <div className="relative w-full h-[320px] sm:h-[420px]">
        <Image
          src={currentRestaurant.imageUrl}
          alt={currentRestaurant.title}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 custom-gradient" />

        <div className="relative z-10 h-full flex flex-col justify-end gap-3 text-white _container pb-8">
          <h1 className="text-3xl sm:text-5xl leading-tight font-display font-bold">{currentRestaurant.title}</h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl">{currentRestaurant.description}</p>
          <div className="flex gap-2 items-center flex-wrap">
            <Rating value={currentRestaurant.rating} size={18} />
            <span className="text-base font-medium">
              {currentRestaurant.rating} ({currentRestaurant.reviews.length} Reviews)
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span>{currentRestaurant.address.street} {currentRestaurant.address.houseNumber}, {currentRestaurant.address.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>{currentRestaurant.startDay}-{currentRestaurant.endDay}: {currentRestaurant.startHour}-{currentRestaurant.endHour}</span>
            </div>
          </div>
          <div className="mt-2">
            <Link
              href={`/restaurant/menu/${id}`}
              className="inline-flex items-center justify-center h-11 px-6 rounded-[var(--radius-sm)] bg-white text-ember-700 font-semibold hover:bg-ember-50 transition-colors"
            >
              Order Now
            </Link>
          </div>
        </div>
      </div>

      <div className="my-8 border-b border-border pb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between _container">
        <div className="flex flex-col sm:flex-row gap-4 text-ink">
          {currentRestaurant.phone && (
            <div className="flex gap-1.5 items-center">
              <Phone size={18} />
              <span>{currentRestaurant.phone}</span>
            </div>
          )}
          {currentRestaurant.websiteUrl && (
            <div className="flex gap-1.5 items-center">
              <Globe size={18} />
              <Link className="hover:underline" href={currentRestaurant.websiteUrl}>{currentRestaurant.websiteUrl}</Link>
            </div>
          )}
        </div>
        <button
          onClick={toggleFavourite}
          className="rounded-md border border-border transition-colors hover:border-brand hover:text-brand cursor-pointer px-4 py-2 flex items-center font-medium gap-2 text-ink w-fit"
        >
          <Heart size={16} className={cn(isFavourite && "fill-brand text-brand")} />
          <span>Favorite</span>
        </button>
      </div>

      <div className="_container pb-3 flex justify-center">
        <TabList>
          {Object.entries(links).map(([text, link]) => (
            <TabLink key={link} href={link} active={path === link}>{text}</TabLink>
          ))}
        </TabList>
      </div>
    </div>
  )
}
