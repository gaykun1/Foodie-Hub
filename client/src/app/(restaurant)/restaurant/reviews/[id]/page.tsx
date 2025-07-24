"use client"
import { Review } from '@/redux/reduxTypes';
import { calculateStars } from '@/utils/rating';
import axios from 'axios';
import { Pen, Star, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react'

const Page = () => {
    const { id } = useParams() as { id: string }
    const [loading, setLoading] = useState<boolean>(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [active, setActive] = useState<boolean>(false);
    const [text, setText] = useState<string>("");
    const [rating, setRating] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [pagesAmount, setPagesAmount] = useState<number>(1);

    // optimized depending on id and page 
    const getReviews = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/${id}/reviews?page=${page}`);
            if (res.data)
                setReviews(res.data.reviews);
            setPagesAmount(res.data.length);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);

        }
    }, [page, id]);


    const createReview = async () => {
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/reviews`, { id: id, text: text, rating: rating }, { withCredentials: true });
            if (res.data)
                getReviews();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);

        }
    }
    useEffect(() => {
        getReviews();
    }, [page])
    console.log(pagesAmount);
    return (
        <div className='flex flex-col gap-9 pb-8'>
            <div className="flex items-center justify-between">

                <h1 className='section-title'>Reviews</h1>

                {active ? (<button onClick={() => {
                    setActive(false);

                }} className='p-3 rounded-md btn  '><X size={16} /></button>) : (<button onClick={() => {
                    setActive(true);

                }} className='p-3 rounded-md btn '><Pen size={16} /></button>)}

            </div>
            {active &&
                (

                    <div className='flex items-start gap-2 border-b-[1px] border-borderColor pb-6'>
                        <textarea onChange={(e) => setText(e.target.value)} placeholder='Type in your text...' className='input p-3 resize-none h-[220px]  max-w-[600px] w-full'></textarea>
                        <div className="flex flex-col gap-2">
                            <button onClick={async () => {
                                setActive(false);
                                await createReview();

                            }} className='btn p-2  bottom-[7px] right-0'>Create</button>
                            <div className="flex flex-col gap-1">
                                <div className="flex gap-1">

                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}

                                            onClick={() => { setRating(i + 1) }}
                                            size={20}
                                            className={
                                                i < rating
                                                    ? "text-primary fill-primary"
                                                    : "text-primary"
                                            }
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2 text-base font-medium">
                                    <span>Rating:</span>
                                    {rating}
                                </div>

                            </div>
                        </div>
                    </div>

                )}
            <div className='grid md:grid-cols-2 gap-5'>
                {
                    loading ? (<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto"></div>) :
                        reviews.length > 0 ? reviews.map((review, idx) => {
                            // func that returns array of stars icons depending on review.rating prop
                            const starRating = calculateStars(review.rating || 0);
                            return (
                                <div key={idx} className=" flex flex-col gap-1 border-borderColor border-[1px] p-2 rounded-lg">
                                    <h2 className="mb-1 text-lg leading-7 font-medium border-b-[1px] border-borderColor pb-0.5">{review.sender.username}</h2>
                                    <p className='leading-7 text-base break-all'>{review.text}</p>
                                    <div className="flex  gap-2 items-center">
                                        <div className="flex items-center gap-3 ">{starRating}</div>
                                        <span className='text-lg font-medium'>{review.rating}</span> </div>

                                </div>
                            )
                        }) : (<span className='text-lg leading-5 font-medium text-center col-span-2 mt-6'>No info yet!</span>)

                }
            </div>
            <div className='mt-6 flex items-center gap-5 justify-center'>
                {/* creating array with length of pages to make length iterations  */}
                {pagesAmount > 1 && Array.from({ length: pagesAmount }).map((_, idx) => (
                    <button onClick={() => setPage(idx + 1)} key={idx} className={`w-[40px] aspect-square flex items-center justify-center rounded-lg border-borderColor transition-colors hover:bg-primary cursor-pointer border-[1px] font-semibold text-lg  ${page === (idx + 1) ? "bg-primary" : ""}  `}>{idx + 1}</button>
                ))}
            </div>
        </div>
    )
}

export default Page