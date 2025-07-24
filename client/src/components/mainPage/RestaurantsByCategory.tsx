"use client"
import { getRestaurantsFiltered } from '@/api/api';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { Category } from '@/redux/reduxTypes';
import { getRestaurants } from '@/redux/restaurantSlice';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import RestaurantCard from './RestaurantCard'




const RestaurantsByCategory = () => {
    const [isActive, setIsActive] = useState<string>(Category.All);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const { restaurants } = useAppSelector(state => state.restaurants);
    const categories = useMemo(() => Object.values(Category), []);

    // memorized func for fetching restaurants
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
    // depending on active state(categorie value)
    useEffect(() => {
        fetchRestaurants(isActive);
    }, [isActive])

    return (
        <section className='mb-16'>
            <h1 className='section-title mb-[22px]'>Browse by Category</h1>
            <div className="flex gap-4 items-center mb-[60px] flex-wrap">
                {categories.map((categorie, index) => {
                    return (
                        <button key={index} onClick={async () => { fetchRestaurants(categorie); }} className={`h-10 cursor-pointer transition-all   flex items-center justify-center px-3 font-medium text-sm leading-[22px]  rounded-[30px] border-[1px] border-borderColor ${isActive === categorie ? "bg-primary text-white" : "bg-transparent"} `} >{categorie}</button>
                    )
                })}
            </div>
            {isLoading
                ?
                (<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto"></div>) :
                (
                    isActive === Category.All ? (<>
                        <div className="flex justify-between items-center gap-5 md:mb-2">
                            <h1 className='section-title'>Top-Rated Restaurants</h1>
                            <Link href={`restaurants/category/all-restaurants`} className="flex items-center sm:gap-2  leading-[22px] font-medium text-primary group">
                                <span className='group-hover:text-black transition-colors '>View All</span>
                                <ChevronRight className='group-hover:text-black transition-colors  ' />
                            </Link>

                        </div>
                        <div className="grid md:grid-cols-3 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 p-10 md:p-0 gap-6">
                            {restaurants?.slice().sort((a, b) => b.rating - a.rating).map((restaurant) => {
                                return (
                                    <RestaurantCard key={restaurant._id} restaurant={restaurant} />
                                )
                            })}
                        </div>
                    </>
                    ) : (
                        <div className="grid md:grid-cols-3 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 p-10 md:p-0 gap-6">
                            {restaurants?.map((restaurant, index) => {
                                return (
                                    <RestaurantCard key={index} restaurant={restaurant} />
                                )
                            })}
                        </div>
                    )
                )
            }
            {restaurants?.length == 0 && (<h2 className='text-xl font-semibold text-center'>No restaurants</h2>)}

        </section>
    )
}

export default RestaurantsByCategory