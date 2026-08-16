"use client"
import { useAppSelector } from '@/hooks/reduxHooks';
import { Dish } from '@/redux/reduxTypes';
import axios from 'axios';
import { MapPinned } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import DishCard from '../Dashboard/DishCard';
import { DishCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';

const DishesNearYou = () => {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const { user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (user?.address?.city) {
            const getDishesNearYou = async () => {
                try {
                    setLoading(true);
                    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/dishes/nearby`, { params: { city: user.address.city } });
                    if (res.data) setDishes(res.data);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                    setLoaded(true);
                }
            };
            getDishesNearYou();
        } else {
            setLoaded(true);
        }
    }, [user?.address?.city])

    return (
        <section className="mb-16">
            <h2 className="section-title mb-5">Trending Dishes Near You</h2>

            {loading ? (
                <div className="flex gap-6 overflow-x-hidden">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="w-[260px] shrink-0"><DishCardSkeleton /></div>
                    ))}
                </div>
            ) : dishes.length > 0 ? (
                <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
                    {dishes.map((dish) => (
                        <div key={dish._id} className="w-[260px] shrink-0 snap-start">
                            <DishCard toCart={true} dish={dish} />
                        </div>
                    ))}
                </div>
            ) : loaded ? (
                <EmptyState
                    icon={<MapPinned size={22} />}
                    title={user ? "Add your city to see trending dishes" : "Sign in to see dishes near you"}
                    description={user ? "Save your address in your profile so we can find what's popular nearby." : "Trending dishes are personalized to your saved delivery city."}
                    action={user ? <ButtonLink href="/profile" size="sm">Update profile</ButtonLink> : <ButtonLink href="/auth/login" size="sm">Log in</ButtonLink>}
                />
            ) : null}
        </section>
    )
}

export default DishesNearYou
