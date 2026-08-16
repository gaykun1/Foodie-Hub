import { Restaurant } from '@/redux/reduxTypes'
import { ChevronRight, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Card } from '@/components/ui/Card'
import { Rating } from '@/components/ui/Rating'

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => {
    return (
        <Card padding="none" interactive className="flex flex-col h-full">
            <div className="relative aspect-video w-full">
                <Image
                    src={restaurant.imageUrl}
                    alt={restaurant.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                />
            </div>
            <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold leading-7 text-ink">{restaurant.title}</h3>
                    <p className="text-sm leading-5 text-inkMuted line-clamp-2">{restaurant.description}</p>
                </div>
                <div className="flex justify-between items-center mt-auto">
                    <Rating value={restaurant.rating} size={14} />
                    {restaurant.place && (
                        <div className="text-sm leading-5 text-inkMuted flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{restaurant.place}</span>
                        </div>
                    )}
                </div>
                <Link href={`/restaurant/menu/${restaurant._id}`} className="btn-transparent gap-2 h-10 group">
                    <span>View Menu</span>
                    <ChevronRight className="group-hover:translate-x-0.5 transition-transform" size={14} />
                </Link>
            </div>
        </Card>
    )
}

export default React.memo(RestaurantCard)
