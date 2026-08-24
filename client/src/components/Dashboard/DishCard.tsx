"use client"
import { restaurantsApi } from '@/api'
import { useCart, type CartRestaurant } from '@/hooks/useCart'
import { Dish } from '@/redux/reduxTypes'
import { ShoppingCart, X, Check } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

const DishCard = ({
    dish,
    toCart,
    restaurant,
    onDeleted,
}: {
    dish: Dish,
    toCart: boolean,
    /**
     * Required to add to cart. A guest basket lives in localStorage and has no
     * server document to resolve the restaurant from, so the caller supplies it.
     */
    restaurant?: CartRestaurant,
    onDeleted?: () => void,
}) => {
    const { cart, addItem } = useCart();
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const toast = useToast();

    const deleteDish = async () => {
        try {
            setDeleting(true);
            await restaurantsApi.deleteDish(dish._id);
            if (onDeleted) onDeleted();
        } catch (err) {
            console.error(err);
            toast.error("Couldn't remove this dish. Please try again.");
        } finally {
            setDeleting(false);
        }
    }

    const handleAddToCart = async () => {
        if (!restaurant) return;
        try {
            setAdding(true);
            const { replacedRestaurant } = await addItem(dish, restaurant);
            if (replacedRestaurant) {
                toast.info(`Your cart now holds ${restaurant.title} — one restaurant per order.`);
            } else {
                toast.success(`${dish.title} added to cart`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Couldn't add this dish to your cart.");
        } finally {
            setAdding(false);
        }
    }

    const isInCart = useMemo(
        () => cart?.items.some(item => item.dishId._id === dish._id),
        [cart, dish._id]
    );

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
                            data-testid="add-to-cart"
                            disabled={isInCart || !restaurant}
                            loading={adding}
                            onClick={handleAddToCart}
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
