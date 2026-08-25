"use client"
import { restaurantsApi } from '@/api';
import { isNotFound } from '@/lib/apiClient';
import { Category, Restaurant } from '@/redux/reduxTypes';
import { ChevronRight, Store, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import RestaurantCard from './RestaurantCard'
import { CardGridSkeleton, RestaurantCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const RestaurantsByCategory = () => {
    const [isActive, setIsActive] = useState<Category>(Category.All);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const categories = useMemo(() => Object.values(Category), []);

    const fetchRestaurants = useCallback(async (category: Category) => {
        // Set immediately, not after the request resolves — otherwise a 404
        // (a category with no restaurants, which is a normal empty result, not
        // a failure) or any network error left this never called, so the
        // previously active button stayed highlighted while the category the
        // user actually clicked silently did nothing.
        setIsActive(category);
        try {
            setIsLoading(true);
            setError(false);
            setRestaurants(await restaurantsApi.getRestaurantsFiltered(category));
        } catch (err) {
            if (isNotFound(err)) {
                setRestaurants([]);
            } else {
                console.error(err);
                setError(true);
            }
        } finally {
            setIsLoading(false);
        }
    }, [])

    useEffect(() => {
        void fetchRestaurants(isActive);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const gridClasses = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5";
    const sorted = useMemo(
        () => (isActive === Category.All ? [...restaurants].sort((a, b) => b.rating - a.rating) : restaurants),
        [restaurants, isActive]
    );

    return (
        <section className="mb-16">
            <div className="flex gap-3 items-center mb-8 flex-wrap">
                {categories.map((categorie) => (
                    <button
                        key={categorie}
                        onClick={() => fetchRestaurants(categorie)}
                        aria-pressed={isActive === categorie}
                        className={cn(
                            "h-10 cursor-pointer transition-colors flex items-center justify-center px-4 font-medium text-sm rounded-full border",
                            isActive === categorie
                                ? "bg-brand text-onBrand border-brand"
                                : "bg-transparent text-inkMuted border-border hover:text-ink"
                        )}
                    >
                        {categorie}
                    </button>
                ))}
            </div>

            {isActive === Category.All && (
                <div className="flex justify-between items-center gap-5 mb-4">
                    <div><h2 className="section-title">Top picks near you</h2><p className="mt-1 text-sm text-inkMuted">Hand-picked from the best local kitchens</p></div>
                    <Link href="/restaurants/category/all-restaurants" className="flex items-center gap-1 font-medium text-brand group whitespace-nowrap">
                        <span className="group-hover:text-brandHover transition-colors">View All</span>
                        <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            )}

            {isLoading ? (
                <CardGridSkeleton count={4} item={RestaurantCardSkeleton} />
            ) : error ? (
                <EmptyState
                    icon={<TriangleAlert size={22} />}
                    title="Couldn't load restaurants"
                    description="The request didn't get through. Try again in a moment."
                    action={<Button size="sm" onClick={() => fetchRestaurants(isActive)}>Try again</Button>}
                />
            ) : sorted.length > 0 ? (
                <div className={gridClasses}>
                    {sorted.map((restaurant) => (
                        <RestaurantCard key={restaurant._id} restaurant={restaurant} />
                    ))}
                </div>
            ) : (
                <EmptyState icon={<Store size={22} />} title="No restaurants found" description="Try a different category, or check back soon." />
            )}
        </section>
    )
}

export default RestaurantsByCategory
