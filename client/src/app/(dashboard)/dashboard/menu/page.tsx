"use client"

import { Restaurant } from '@/redux/reduxTypes';
import { restaurantsApi } from '@/api';
import { Pen, Search, Store } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardGridSkeleton } from '@/components/ui/Skeleton';

const RestaurantRowSkeleton = () => (
    <div className="flex gap-4 border border-border p-4 rounded-lg">
        <div className="size-20 rounded-md bg-skeleton animate-pulse shrink-0" />
        <div className="flex flex-col justify-center gap-2 flex-1">
            <div className="h-5 w-2/3 bg-skeleton animate-pulse rounded" />
        </div>
    </div>
);

const Page = () => {
    const [word, setWord] = useState<string>("");
    const [items, setItems] = useState<Pick<Restaurant, "imageUrl" | "title" | "_id">[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const searchRestaurants = useCallback(async () => {
        try {
            setLoading(true);
            setItems(await restaurantsApi.searchRestaurants(word));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [word])

    useEffect(() => {
        const timeout = setTimeout(() => {
            searchRestaurants();
        }, 500);
        return () => clearTimeout(timeout);
    }, [word, searchRestaurants])

    return (
        <div className="flex flex-col items-center">
            <div className="flex flex-col text-center gap-8 max-w-[600px] w-full">
                <div className="flex items-center gap-3 justify-center">
                    <h1 className="section-title">Find restaurant</h1>
                    <Search size={28} className="text-brand" />
                </div>
                <input
                    onChange={(e) => setWord(e.target.value)}
                    className="input h-12 px-4"
                    type="text"
                    placeholder="Search for a restaurant..."
                    aria-label="Search for a restaurant"
                />
                <div className="min-h-[150px]">
                    {loading ? (
                        <CardGridSkeleton count={3} item={RestaurantRowSkeleton} />
                    ) : items && items.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {items.map((item) => (
                                <Card key={item._id} padding="sm" className="flex gap-4 items-center text-left">
                                    <div className="relative size-20 shrink-0 rounded-md overflow-hidden border border-border bg-sand-100">
                                        <Image src={item.imageUrl} alt={item.title} fill sizes="80px" className="object-cover" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-ink flex-1">{item.title}</h3>
                                    <Link href={`menu/${item._id}`}>
                                        <Button variant="secondary" size="sm" aria-label={`Edit ${item.title}`} icon={<Pen size={16} />} />
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<Store size={22} />} title="No restaurants found" description="Try a different search term." />
                    )}
                </div>
            </div>
        </div>
    )
}

export default Page
