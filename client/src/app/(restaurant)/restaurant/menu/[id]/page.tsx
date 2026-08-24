"use client"
import DishCard from '@/components/Dashboard/DishCard';
import { Dish } from '@/redux/reduxTypes';
import { restaurantsApi } from '@/api';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react'
import { CardGridSkeleton, DishCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { UtensilsCrossed, TriangleAlert } from 'lucide-react';
import type { CartRestaurant } from '@/hooks/useCart';

const typesOfFood = ["Appetizers", "Main Courses", "Desserts", "Drinks"] as const;

const Page = () => {
    const [menu, setMenu] = useState<Dish[]>([]);
    const [restaurant, setRestaurant] = useState<CartRestaurant | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const { id } = useParams() as { id: string };

    const loadMenu = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            // This endpoint returns the restaurant document with `dishes`
            // populated, so one request covers both the menu and the restaurant
            // identity the cart needs.
            const data = await restaurantsApi.getDishes(id);
            setMenu(data?.dishes ?? []);
            setRestaurant(data ? { _id: data._id, title: data.title, imageUrl: data.imageUrl } : null);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [id])

    useEffect(() => {
        void loadMenu();
    }, [loadMenu])

    if (loading) {
        return (
            <div className="flex flex-col gap-9 pb-8">
                <h1 className="section-title">Our Menu</h1>
                <CardGridSkeleton count={8} item={DishCardSkeleton} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-9 pb-8">
                <h1 className="section-title">Our Menu</h1>
                <EmptyState
                    icon={<TriangleAlert size={22} />}
                    title="We couldn't load this menu"
                    description="The kitchen is there, the connection wasn't. Give it another try."
                    action={<Button onClick={loadMenu}>Try again</Button>}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-9 pb-8">
            <h1 className="section-title">Our Menu</h1>
            {menu.length === 0 ? (
                <EmptyState
                    icon={<UtensilsCrossed size={22} />}
                    title="No dishes yet"
                    description="This restaurant hasn't added any dishes to their menu."
                />
            ) : (
                typesOfFood.map((type) => {
                    const dishes = menu.filter(dish => dish.typeOfFood === type);
                    if (dishes.length === 0) return null;
                    return (
                        <div className="flex flex-col gap-4" key={type}>
                            <h2 className="text-2xl leading-8 font-semibold pb-1.5 border-b border-border text-ink">{type}</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {dishes.map((dish) => (
                                    <DishCard toCart={true} dish={dish} restaurant={restaurant ?? undefined} key={dish._id} />
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    )
}

export default Page
