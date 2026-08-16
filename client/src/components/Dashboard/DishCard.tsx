"use client"
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks'
import { getCart } from '@/redux/cartSlice'
import { Dish } from '@/redux/reduxTypes'
import axios from 'axios'
import { ShoppingCart, X, Check } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

const DishCard = ({ dish, toCart, onDeleted }: { dish: Dish, toCart: boolean, onDeleted?: () => void }) => {

    const dispatch = useAppDispatch();
    const { cart } = useAppSelector(state => state.cart);
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const toast = useToast();

    const deleteDish = async () => {
        try {
            setDeleting(true);
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/dishes/${dish._id}`);
            if (onDeleted) onDeleted();
        } catch (err) {
            console.error(err);
            toast.error("Couldn't remove this dish. Please try again.");
        } finally {
            setDeleting(false);
        }
    }

    const addToCart = async () => {
        try {
            setAdding(true);
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/items`, { id: dish._id }, { withCredentials: true });
            if (res.data) {
                dispatch(getCart(res.data));
                toast.success(`${dish.title} added to cart`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Couldn't add this dish to your cart.");
        } finally {
            setAdding(false);
        }
    }

    const handleClick = useCallback(() => {
        addToCart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const isInCart = useMemo(() => cart?.items.some(item => item.dishId.title === dish.title), [cart, dish.title]);

    return (
        <Card padding="none" className="flex flex-col h-full">
            <div className="relative aspect-[4/3] w-full bg-sand-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="absolute inset-0 w-full h-full object-cover" src={dish.imageUrl} alt={dish.title} />
            </div>
            <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                <div>
                    <h3 className="text-lg leading-7 font-semibold text-ink">{dish.title}</h3>
                    <p className="text-inkMuted text-sm mt-1 line-clamp-2">{dish.description}</p>
                </div>
                <div>
                    <div className="text-brand font-bold text-xl font-display mb-3">
                        ${dish.price.toFixed(2)}
                    </div>
                    {toCart ? (
                        <Button
                            disabled={isInCart}
                            loading={adding}
                            onClick={handleClick}
                            fullWidth
                            icon={!isInCart ? <ShoppingCart size={16} /> : <Check size={16} />}
                        >
                            {!isInCart ? "Add to Cart" : "In Cart"}
                        </Button>
                    ) : (
                        <Button
                            variant="danger"
                            loading={deleting}
                            onClick={deleteDish}
                            aria-label={`Remove ${dish.title}`}
                            icon={<X size={16} />}
                        />
                    )}
                </div>
            </div>
        </Card>
    )
}

export default React.memo(DishCard);
