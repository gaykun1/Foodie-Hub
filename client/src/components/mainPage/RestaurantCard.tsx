import { Restaurant } from '@/redux/reduxTypes'
import { ChevronRight, Clock, Star } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const RestaurantCard = ({restaurant}:{restaurant:Restaurant}) => {
  return (
    <div>
         <div  className="shadow-xs rounded-lg border-[1px] overflow-hidden border-borderColor ">
                                        <div className="mb-5  h-40 w-full overflow-hidden">

                                            <img src={restaurant.imageUrl} alt="Restaurant" />
                                        </div>
                                        <div className="pb-[17px] pr-[17px] pl-5 flex flex-col gap-3">
                                            <div className="flex flex-col gap-[2px]">
                                                <h3 className='text-[18px] font-semibold leading-7'>{restaurant.title}</h3>
                                                <p className='text-sm leading-5 text-gray'>{restaurant.description}</p>
                                            </div>
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-1 text-primary">
                                                    <Star size={14} />
                                                    <span>{restaurant.rating}</span>
                                                </div>
                                                <div className='text-sm leading-5 text-gray flex items-center gap-1'>
                                                    <Clock size={14} />
                                                    <span>15-25 min</span>
                                                </div>
                                            </div>
                                            <Link href={`/restaurant/menu/${restaurant._id}`} className='btn-transparent gap-2 h-10 group'>
                                                <span>View Menu</span>
                                                <ChevronRight className='group-hover:rotate-90 transition-transform' size={14} />
                                            </Link>
                                        </div>
                                    </div>
    </div>
  )
}

export default RestaurantCard