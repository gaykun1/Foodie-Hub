"use client"
import { getRestaurantsFiltered } from '@/api/auth';
import { useAppSelector } from '@/hooks/reduxHooks';
import { Dish } from '@/redux/reduxTypes';
import axios from 'axios';
import { ChevronRight, ShoppingCart, } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import DishCard from '../Dashboard/DishCard';




const DishesNearYou = () => {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const { user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if(user?.address?.city){
        const getDishesNearYou = async () => {
            const res = await axios.get(`http://localhost:5200/api/restaurant/dishes-near-you?city=${user.address.city}`,);
            if (res.data)
                setDishes(res.data);
        };
        getDishesNearYou();
        }

    }, [user?.address?.city])


    return (
        <section className='mb-16'>
            <div className="flex justify-between items-center">

                <h1 className='section-title mb-[22px]  '>Trending Dishes Near You</h1>


            </div>
            <div className="grid grid-cols-5 gap-x-6">
                {dishes.length > 0 ?

                    dishes.map((dish, idx) => (
                        <DishCard toCart={true} dish={dish} key={idx} />
                    ))

                    : <span className='text-xl font-semibold leading-8'>No dishes</span>}


            </div>


        </section>
    )
}

export default DishesNearYou