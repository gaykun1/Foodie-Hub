"use client"
import { useAppSelector } from '@/hooks/reduxHooks';
import { Dish } from '@/redux/reduxTypes';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import DishCard from '../Dashboard/DishCard';

const DishesNearYou = () => {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const { user } = useAppSelector((state) => state.auth);

    // func for getting dishes after every render (provided if user added City in profile settings form)
    useEffect(() => {
        if (user?.address?.city) {
            const getDishesNearYou = async () => {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/dishes/nearby`, { params: { city: user.address.city } });
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

            {dishes.length > 0 ?
                <div className="grid md:grid-cols-3 sm:grid-cols-2 p-10 sm:p-0  lg:grid-cols-5 gap-6">
                    {dishes.map((dish) => (
                        <DishCard toCart={true} dish={dish} key={dish._id} />
                    ))}
                </div>
                : <div className=' w-full flex justify-center'><span className='text-xl font-semibold leading-8'>No dishes</span></div>}





        </section>
    )
}

export default DishesNearYou