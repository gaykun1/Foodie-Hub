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
                                    <div key={index} className="flex justify-between overflow-hidden rounded-md items-center border-[1px]">
                                        <div className="flex gap-3 basis-[350px]">
                                            <img src={item.imageUrl} className='max-w-[100px] w-full h-[70px] border-r-[1px]' alt="" />
                                            <h1 className='text-2xl font-medium '>Restaurant "{item.title}" </h1>

                                        </div>

                                        <div className="flex ">
                                            <Link href={`menu/${item._id}`} className="btn p-3 mr-5">
                                                <Pen />
                                            </Link>
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


    // <div div key = { idx } className = "flex items-center justify-between border-b-[1px] border-borderColor py-2" >
    //                   <div className="flex items-center gap-4">
    //                     <div className=" border-[1px] size-20 relative  border-borderColor rounded-md overflow-hidden">
    //                       <img className="object-cover absolute top-0 left-0 w-full h-full" src={item.imageUrl} alt="dish image" />
                       
    //                     </div>
    //                        <div className="">
    //                         <h3 className='text-base leading-6 font-semibold'>
    //                           {item.title}
    //                         </h3>
    //                         <span className='text-sm leading-5 text-gray'>Quantity: {item.amount}</span>
    //                       </div>
    //                   </div>
    //                   <div className="font-bold ">${item.price.toFixed(2)}</div>
    //                 </div >