"use client"

import { Restaurant } from '@/redux/reduxTypes';
import axios from 'axios';
import { Pen, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react'

const page = () => {
    const [word, setWord] = useState<string>("");
    const [items, setItems] = useState<Pick<Restaurant, "imageUrl" | "title" | "_id">[] | null>(null);
    useEffect(() => {
        const searchRestaurants = async () => {
            try {
                const res = await axios.post(`http://localhost:5200/api/restaurant/search-restaurants`, { chars: word });
                setItems(res.data);
            } catch (err) {
                console.log(err);
            }
        }


        searchRestaurants();
        console.log(items);
    }, [word])

    return (
        <div className="flex flex-col items-center">
            <div className='flex flex-col text-center gap-10 max-w-[600px] w-full'>
                <div className="flex items-center gap-3 justify-center">
                    <h1 className='section-title '>Find restaurant </h1>

                    <Search size={30} />
                </div>
                <input onChange={(e) => setWord(e.target.value)} className='input  p-3' type="text" />
                <div className="min-h-[150px] border-borderColor rounded-md border-[2px] p-3 ">
                    {items ? (

                        <div className='flex flex-col gap-4'>{
                            items.map((item, index) => {
                                return (
                                    <div key={index} className="flex  gap-4 border-[1px] p-4 rounded-lg border-borderColor ">
                                        <div className=" border-[1px] size-20 relative  border-borderColor rounded-md overflow-hidden">
                                            <img className="object-cover absolute top-0 left-0 w-full h-full" src={item.imageUrl} alt="dish image" />

                                        </div>
                                        <div className="flex flex-col justify-between">
                                            <h3 className='text-xl leading-6 font-semibold'>
                                                {item.title}
                                            </h3>
                                            <div className="flex ">
                                                <Link href={`menu/${item._id}`} className="btn p-3 mr-5">
                                                    <Pen />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        } </div>
                    )

                        : (
                            <span>Not found!</span>
                        )}
                </div>
            </div>
        </div>
    )
}

export default page


