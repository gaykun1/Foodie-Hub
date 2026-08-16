"use client"
import DishCard from '@/components/Dashboard/DishCard';
import { Dish } from '@/redux/reduxTypes';
import axios from 'axios';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react'
import { CardGridSkeleton, DishCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { UtensilsCrossed } from 'lucide-react';

const typesOfFood = ["Appetizers", "Drinks", "Desserts", "Main Courses"]

const Page = () => {
    const [menu, setMenu] = useState<Dish[]>([]);
    const [dishesLoading, setDishesLoading] = useState<boolean>(false);
    const { id } = useParams() as { id: string };

    const getDishes = useCallback(async () => {
        try {
            setDishesLoading(true);
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/dishes/${id}`);
            if (res.data) setMenu(res.data.dishes);
        } catch (err) {
            console.error(err);
        } finally {
            setDishesLoading(false);
        }
    }, [id])

    useEffect(() => {
        getDishes();
    }, [getDishes])

    return (
        <div className="flex flex-col gap-9 pb-8">
            <h1 className="section-title">Our Menu</h1>
            {dishesLoading ? (
                <CardGridSkeleton count={8} item={DishCardSkeleton} />
            ) : menu.length === 0 ? (
                <EmptyState icon={<UtensilsCrossed size={22} />} title="No dishes yet" description="This restaurant hasn't added any dishes to their menu." />
            ) : (
                typesOfFood.map((type) => {
                    const dishes = menu.filter(dish => dish.typeOfFood === type);
                    if (dishes.length === 0) return null;
                    return (
                        <div className="flex flex-col gap-4" key={type}>
                            <h2 className="text-2xl leading-8 font-semibold pb-1.5 border-b border-border text-ink">{type}</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {dishes.map((dish) => (
                                    <DishCard toCart={true} dish={dish} key={dish._id} />
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
