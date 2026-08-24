"use client"
import { useAppSelector } from '@/hooks/reduxHooks';
import { restaurantsApi } from '@/api';
import type { DishWithRestaurant } from '@/api/restaurants';
import { MapPinned, TriangleAlert } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react'
import DishCard from '../Dashboard/DishCard';
import { DishCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button, ButtonLink } from '@/components/ui/Button';

const DishesNearYou = () => {
    const [dishes, setDishes] = useState<DishWithRestaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const { user } = useAppSelector((state) => state.auth);
    const city = user?.address?.city;

    // Runs for guests too: without a city the endpoint returns the platform's
    // best sellers, so the section always has something to show rather than
    // being a sign-in prompt on the home page.
    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            setDishes(await restaurantsApi.getDishesNearYou(city));
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [city]);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <section className="mb-16">
            <h2 className="section-title mb-5">
                {city ? "Trending Dishes Near You" : "Trending Dishes"}
            </h2>

            {loading ? (
                <div className="flex gap-6 overflow-x-hidden">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="w-[260px] shrink-0"><DishCardSkeleton /></div>
                    ))}
                </div>
            ) : error ? (
                <EmptyState
                    icon={<TriangleAlert size={22} />}
                    title="Couldn't load trending dishes"
                    description="The request didn't get through. Try again in a moment."
                    action={<Button size="sm" onClick={load}>Try again</Button>}
                />
            ) : dishes.length > 0 ? (
                <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
                    {dishes.map((dish) => (
                        <div key={dish._id} className="w-[260px] shrink-0 snap-start">
                            <DishCard toCart={true} dish={dish} restaurant={dish.restaurant} />
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<MapPinned size={22} />}
                    title={city ? `Nothing trending in ${city} yet` : "No dishes yet"}
                    description={
                        city
                            ? "No restaurants are serving your city right now. Browse everything instead."
                            : "Once restaurants start selling, their most popular dishes appear here."
                    }
                    action={<ButtonLink href="/restaurants/category/all-restaurants" size="sm">Browse restaurants</ButtonLink>}
                />
            )}
        </section>
    )
}

export default DishesNearYou
