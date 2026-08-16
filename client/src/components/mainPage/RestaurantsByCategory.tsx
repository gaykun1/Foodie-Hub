"use client"
import { getRestaurantsFiltered } from '@/api/api';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { Category } from '@/redux/reduxTypes';
import { getRestaurants } from '@/redux/restaurantSlice';
import { ChevronRight, Store } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import RestaurantCard from './RestaurantCard'
import { CardGridSkeleton, RestaurantCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';

const RestaurantsByCategory = () => {
    const [isActive, setIsActive] = useState<string>(Category.All);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const { restaurants } = useAppSelector(state => state.restaurants);
    const categories = useMemo(() => Object.values(Category), []);

    const fetchRestaurants = useCallback(async (category: string) => {
        try {
            setIsLoading(true);
            const info = await getRestaurantsFiltered(category);
            if (info) dispatch(getRestaurants(info));
            setIsActive(category);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [dispatch])

    useEffect(() => {
        fetchRestaurants(isActive);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive])

    const gridClasses = "grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";
    const sorted = useMemo(
        () => (isActive === Category.All ? [...(restaurants ?? [])].sort((a, b) => b.rating - a.rating) : restaurants ?? []),
        [restaurants, isActive]
    );

    return (
        <section className="mb-16">
            <h2 className="section-title mb-5">Browse by Category</h2>
            <div className="flex gap-3 items-center mb-10 flex-wrap">
                {categories.map((categorie) => (
                    <button
                        key={categorie}
                        onClick={() => fetchRestaurants(categorie)}
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
                    <h2 className="section-title">Top-Rated Restaurants</h2>
                    <Link href="/restaurants/category/all-restaurants" className="flex items-center gap-1 font-medium text-brand group whitespace-nowrap">
                        <span className="group-hover:text-brandHover transition-colors">View All</span>
                        <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            )}

            {isLoading ? (
                <CardGridSkeleton count={4} item={RestaurantCardSkeleton} />
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
