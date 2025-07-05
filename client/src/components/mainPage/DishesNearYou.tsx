"use client"
import { getRestaurantsFiltered } from '@/api/auth';
import { Category, Restaurant } from '@/redux/reduxTypes';
import { ChevronRight, ShoppingCart, } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'




const DishesNearYou = () => {
    const [isActive, setIsActive] = useState<Category>(Category.All);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    useEffect(() => {
        const fetchRestaurants = async () => {
            const info = await getRestaurantsFiltered(isActive);
            if (info)
                setRestaurants(info);
        };
        fetchRestaurants();
    }, [isActive])

    return (
        <section className='mb-16'>
              <div className="flex justify-between items-center">

                    <h1 className='section-title mb-[22px]  '>Trending Dishes Near You</h1>
                    <Link href={"#"} className="flex items-center gap-2 leading-[22px] font-medium text-primary group">
                    <span  className='group-hover:text-black transition-colors '>View All</span>
                    <ChevronRight className='group-hover:text-black transition-colors ' size={16}/>
                    </Link>
                        
                </div>
              <div className="grid grid-cols-5 gap-x-6">
                              {restaurants.sort((a,b)=>a.rating-b.rating).map((restaurant, index) => {
                                  return (
                                      <div key={index} className="shadow-xs rounded-lg border-[1px] overflow-hidden border-borderColor ">
                                          <div className="mb-5 bg-black h-40 w-full"></div>
                                          <div className="pb-[17px] pr-[17px] pl-5 flex flex-col gap-3">
                                              <div className="flex flex-col gap-[2px]">
                                                  <h3 className='text-base font-semibold leading-6'>{restaurant.title}</h3>
                                                  <p className='text-sm leading-5 text-gray'>Description</p>
                                              </div>
                                            <div className="flex justify-between items-center ">
                                                <span className='leading-7 text-[18px] font-semibold'>$15.99</span>
                                                <Link href={"#"} className="rounded-full hover:bg-[#4850E4FF] transition-colors flex items-center justify-center bg-primary h-9 w-10 text-white">
                                                    <ShoppingCart size={14} />
                                                </Link>
                                            </div>
                                              
                                          </div>
                                      </div>
                                  )
                              })}
                          </div>
          
           
        </section>
    )
}

export default DishesNearYou