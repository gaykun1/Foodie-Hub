import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks'
import { getCart } from '@/redux/cartSlice'
import { Dish } from '@/redux/reduxTypes'
import axios from 'axios'
import { ShoppingCart, X } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'

const DishCard = ({ dish, toCart, onDeleted }: { dish: Dish, toCart: boolean, onDeleted?: () => void }) => {

    const dispatch = useAppDispatch();
    const { cart } = useAppSelector(state => state.cart);

    const deleteDish = async () => {
        try {
            const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/dishes/${dish._id}`);

            if (onDeleted) onDeleted();
        } catch (err) {
            console.error(err);
        }
    }


    const addToCart = async () => {
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/items`, { id: dish._id }, { withCredentials: true });
            if (res.data) {
                dispatch(getCart(res.data));
            }
        } catch (err) {
            console.error(err);
        }
    }
    // optimized handleClick func for adding one time item to cart
    const handleClick = useCallback(() => {
        addToCart();
    }, [])
    // memorizing calculation for checking if item is in cart
    const isInCart = useMemo(() => (cart?.items.some(item => item.dishId.title === dish.title)), [cart]);
    return (
        <div className='rounded-lg shadow-xs border-[1px] w-fit flex flex-col gap-5 border-borderColor h-full  overflow-hidden'>
            <div className=" max-w-[324px] relative  w-full aspect-video ">
                <img className=' h-full w-full object-contain' src={dish.imageUrl} alt="dish image" />
            </div>

            <div className="px-4 pb-4 flex flex-col justify-between h-full">
                <div className="">
                    <h2 className='text-lg leading-7 font-semibold '>{dish.title}</h2>
                    <p className='text-gray mb-2.5 mt-[5px]'>{dish.description}</p>
                </div>
                <div className="">
                    <div className="text-[#E8618CFF] font-bold text-xl leading-7 mb-3">
                        ${dish.price}
                    </div>
                    {toCart ? (<button disabled={isInCart} onClick={handleClick} className='!text-base disabled:pointer-events-none disabled:bg-gray! leading-[26px]! py-2 w-full gap-2 flex items-center btn'>
                        {/* disabled  button if in is in cart */}
                        {!isInCart ? (<><ShoppingCart size={16} /><span>Add to Cart</span></>) : (<span>In Cart</span>)}
                    </button>) : (
                        <button onClick={deleteDish} className='text-base! leading-[26px]! gap-2 p-2 bg-[#E8618CFF]! hover:bg-[#e8616c]! flex items-center btn'>

                            <X size={16} />
                        </button>
                    )}
                </div>



            </div>
        </div>
    )
}

export default React.memo(DishCard);