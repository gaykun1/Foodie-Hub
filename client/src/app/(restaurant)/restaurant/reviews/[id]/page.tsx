"use client"
import { Review } from '@/redux/reduxTypes';
import { Rating } from '@/components/ui/Rating';
import axios from 'axios';
import { MessageSquareText, Pen, Star, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

const ReviewCardSkeleton = () => (
    <div className="rounded-lg border border-border p-4 flex flex-col gap-2">
        <div className="h-5 w-1/3 bg-skeleton animate-pulse rounded" />
        <div className="h-4 w-full bg-skeleton animate-pulse rounded" />
        <div className="h-4 w-2/3 bg-skeleton animate-pulse rounded" />
    </div>
);

const Page = () => {
    const { id } = useParams() as { id: string }
    const [loading, setLoading] = useState<boolean>(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [active, setActive] = useState<boolean>(false);
    const [text, setText] = useState<string>("");
    const [rating, setRating] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [pagesAmount, setPagesAmount] = useState<number>(1);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const toast = useToast();

    const getReviews = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/${id}/reviews?page=${page}`);
            if (res.data) setReviews(res.data.reviews);
            setPagesAmount(res.data.length);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, id]);

    const createReview = async () => {
        try {
            setSubmitting(true);
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/reviews`, { id, text, rating }, { withCredentials: true });
            if (res.data) {
                await getReviews();
                setText("");
                setRating(0);
                toast.success("Review posted");
            }
        } catch (err) {
            console.error(err);
            toast.error("Couldn't post your review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        getReviews();
    }, [getReviews])

    return (
        <div className="flex flex-col gap-9 pb-8">
            <div className="flex items-center justify-between">
                <h1 className="section-title">Reviews</h1>
                <Button
                    size="sm"
                    variant="secondary"
                    aria-label={active ? "Cancel review" : "Write a review"}
                    icon={active ? <X size={16} /> : <Pen size={16} />}
                    onClick={() => setActive(!active)}
                />
            </div>

            {active && (
                <div className="flex flex-col sm:flex-row items-start gap-4 border-b border-border pb-6">
                    <Textarea
                        id="review-text"
                        label="Your review"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type in your text..."
                        className="h-[180px] resize-none"
                        wrapperClassName="w-full sm:max-w-[600px]"
                    />
                    <div className="flex flex-col gap-3 shrink-0">
                        <div className="flex flex-col gap-1">
                            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        role="radio"
                                        aria-checked={i < rating}
                                        aria-label={`${i + 1} star${i === 0 ? "" : "s"}`}
                                        onClick={() => setRating(i + 1)}
                                        className="cursor-pointer text-brand"
                                    >
                                        <Star size={20} className={cn(i < rating && "fill-brand")} />
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm font-medium text-inkMuted">Rating: {rating}</span>
                        </div>
                        <Button loading={submitting} disabled={!text.trim() || rating === 0} onClick={createReview}>
                            Post review
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
                {loading ? (
                    <CardGridSkeleton count={4} item={ReviewCardSkeleton} />
                ) : reviews.length > 0 ? reviews.map((review) => (
                    <Card key={review._id} padding="sm" className="flex flex-col gap-1.5">
                        <h2 className="text-lg font-medium text-ink border-b border-border pb-1.5">{review.sender.username}</h2>
                        <p className="leading-6 text-ink/90 break-words">{review.text}</p>
                        <div className="flex gap-2 items-center">
                            <Rating value={review.rating} size={16} />
                            <span className="text-sm font-medium text-inkMuted">{review.rating}</span>
                        </div>
                    </Card>
                )) : (
                    <div className="md:col-span-2">
                        <EmptyState icon={<MessageSquareText size={22} />} title="No reviews yet" description="Be the first to share your experience." />
                    </div>
                )}
            </div>

            {pagesAmount > 1 && (
                <div className="flex items-center gap-3 justify-center flex-wrap">
                    {Array.from({ length: pagesAmount }).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setPage(idx + 1)}
                            aria-current={page === idx + 1 ? "page" : undefined}
                            className={cn(
                                "w-10 aspect-square flex items-center justify-center rounded-lg border transition-colors cursor-pointer font-semibold",
                                page === idx + 1 ? "bg-brand text-onBrand border-brand" : "border-border text-ink hover:bg-surfaceRaised"
                            )}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Page
