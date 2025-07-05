"use client"
import DishCard from '@/components/Dashboard/DishCard';
import { Dish } from '@/redux/reduxTypes';
import axios from 'axios';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'

const Page = () => {
    const [menu, setMenu] = useState<Dish[]>([]);
    const [dishesLoading, setDishesLoading] = useState<boolean>(false);
    const {id} = useParams() as {id:string}
    const getDishes = async () => {
        try {
            setDishesLoading(true);
            const res = await axios.get(`http://localhost:5200/api/restaurant/dishes/${id}`);
            if (res.data)
                setMenu(res.data.dishes);
        } catch (err) {
            console.error(err);
        } finally {
            setDishesLoading(false);

        }
    }
    const typesOfFood = ["Appetizers", "Drinks", "Desserts", "Main Courses"]
    useEffect(() => {
        getDishes();
    }, [])
    return (
        <div className='flex flex-col gap-9 pb-8'>
            <h1 className='section-title'>Our Menu</h1>
            {typesOfFood.map((type, idx) => (
                <div className="flex flex-col gap-4 " key={idx}>
                    <h2 className='text-2xl leading-8 font-semibold pb-1.5 border-b-[1px] border-borderColor'>{type}</h2>
                    <div className="grid grid-cols-4 gap-[25px]">
                        {menu.filter(dish => dish.typeOfFood === type).map((dish, idx) => (
                            <DishCard toCart={true} dish={dish} key={idx} />
                        ))}
                    </div>
                </div>
            ))}

        </div>
    )
}

export default Page