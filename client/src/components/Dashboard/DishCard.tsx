import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks'
import { getCart } from '@/redux/cartSlice'
import { Dish } from '@/redux/reduxTypes'
import axios from 'axios'
import { ShoppingCart, X } from 'lucide-react'
import React from 'react'

const DishCard = ({ dish, toCart, onDeleted }: { dish: Dish, toCart: boolean, onDeleted?: () => void }) => {

    const dispatch = useAppDispatch();
    const { cart } = useAppSelector(state => state.cart);
    const deleteDish = async () => {
        try {
            const res = await axios.delete(`http://localhost:5200/api/restaurant/dishes/${dish._id}`);

            if (onDeleted) onDeleted();
        } catch (err) {
            console.error(err);
        }
    }


    const addToCart = async () => {
        try {
            const res = await axios.post("http://localhost:5200/api/cart/add-to-cart", { id: dish._id }, { withCredentials: true });
            if (res.data) {
                dispatch(getCart(res.data));
            }
        } catch (err) {
            console.error(err);
        }
    }

    const isInCart = (cart?.items.find(item => item.dishId.title === dish.title)) ? true : false;
    return (
        <div className='rounded-lg shadow-xs border-[1px] flex flex-col gap-5 border-borderColor overflow-hidden'>
            <div className=" max-w-[324px]  w-full">
                <img className=' h-40 w-full' src={dish.imageUrl} alt="dish image" />
            </div>
            <div className="px-4 pb-4">
                <h2 className='text-lg leading-7 font-semibold '>{dish.title}</h2>
                <p className='text-gray mb-2.5 mt-[5px]'>{dish.description}</p>
                <div className="text-[#E8618CFF] font-bold text-xl leading-7 mb-3">
                    ${dish.price}
                </div>
                {toCart ? (<button disabled={isInCart} onClick={async () => {
                    await addToCart();
                }} className='text-base! disabled:pointer-events-none disabled:bg-gray! leading-[26px]! py-2 w-full gap-2 flex items-center btn'>

                    {!isInCart ? (<><ShoppingCart size={16} /><span>Add to Cart</span></>) : (<span>In Cart</span>)}
                </button>) : (
                    <button onClick={deleteDish} className='text-base! leading-[26px]! gap-2 p-2 bg-[#E8618CFF]! hover:bg-[#e8616c]! flex items-center btn'>

                        <X size={16} />
                    </button>
                )}

            </div>
        </div>
    )
}

export default DishCard