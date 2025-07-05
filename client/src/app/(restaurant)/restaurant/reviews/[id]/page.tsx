"use client"
import DishCard from '@/components/Dashboard/DishCard';
import { useAppSelector } from '@/hooks/reduxHooks';
import { Dish, Review } from '@/redux/reduxTypes';
import { calculateStars } from '@/utils/rating';
import axios from 'axios';
import { Pen, Star, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';

const Page = () => {

    const { id } = useParams() as { id: string }
    const [loading, setLoading] = useState<boolean>(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [active, setActive] = useState<boolean>(false);
    const [text, setText] = useState<string>("");
    const [rating, setRating] = useState<number>(0);
    const {user} = useAppSelector(state=>state.auth);
    const getReviews = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:5200/api/restaurant/review/${id}`);
            if (res.data)
                setReviews(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);

        }
    }

    const createReview = async () => {
        try {

            const res = await axios.post(`http://localhost:5200/api/restaurant/review`, { id: id, text: text, rating: rating }, { withCredentials: true });
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
    }, [])
    return (
        <div className='flex flex-col gap-9 pb-8'>
            <div className="flex items-center justify-between">

                <h1 className='section-title'>Reviews</h1>
                {/* TODO check user whether hes admin role */}
         
                {active ?(  <button onClick={() => {
                    setActive(false);

                }} className='p-3 rounded-md btn  '><X size={16} /></button>) : (  <button onClick={() => {
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
                <div className='grid grid-cols-2 gap-5'>
            {
                loading ? (<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto"></div>) :
                    reviews.length > 0 ? reviews.map((review, idx) => {
                        return (
                            <div key={idx} className=" flex flex-col gap-1 border-borderColor border-[1px] p-2 rounded-lg">
                                <h2 className="mb-1 text-lg leading-7 font-medium border-b-[1px] border-borderColor pb-0.5">{review.sender.username}</h2>
                                <p className='leading-7 text-base'>{review.text}</p>
                                <div className="flex  gap-2 items-center">
                                    <div className="flex items-center gap-3 ">{calculateStars(review.rating || 0)}</div>
                                   <span className='text-lg font-medium'>{review.rating}</span> </div>

                            </div>
                        )
                    }) : (<span className='text-lg leading-5 font-medium text-center mt-6'>No info yet!</span>)

            }
</div>
        </div>
    )
}

export default Page