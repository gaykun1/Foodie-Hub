"use client"

import { ChevronDown, FileUser, Heart, Home, ListOrdered, Percent, Plus, SquareRoundCorner, User, Utensils, X } from "lucide-react"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";


const ResponsiveSidebar = ({ type }: { type: string }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const path = usePathname();


    const links = useMemo(() => {
        if (type === "profile") return [{ href: '/profile', label: 'Profile', icon: <User size={18} /> },
        { href: '/profile/favourites', label: 'Favorite Restaurants', icon: <Heart size={18} /> },
        ];
        if (type === "admin") return [
            { href: '/dashboard/overview', label: 'Dashboard Overview', icon: <Home size={18} /> },
            { href: '/dashboard/create', label: 'Add a Restaurant', icon: <Plus size={18} /> },
            { href: '/dashboard/promocode', label: 'Procomode Management', icon: <Percent size={18} /> },
            { href: '/dashboard/menu', label: 'Menu Management', icon: <Utensils size={18} /> },
            { href: '/dashboard/applications', label: 'Applications', icon: <FileUser size={18} /> },
        ];
        return [
            { href: '/dashboard/restaurant-overview', label: 'Restaurant overview', icon: <SquareRoundCorner size={18} /> },
            { href: '/dashboard/incoming-orders', label: 'Incoming orders', icon: <ListOrdered size={18} /> },
            { href: '/dashboard/add-dish', label: 'Add a Dish', icon: <Plus size={18} /> },

        ];
    }, [type]);

    return (
        <div className={`flex flex-col gap-4 w-fit`}>
            <button onClick={() => setIsOpen(!isOpen)} className={`w-fit btn p-2 ${isOpen ? "  " : ""}`}>
                <div className={`transition-transform  ${isOpen ? "rotate-180 " : ""}`}>
                    <ChevronDown />

                </div>
            </button>
            {isOpen &&
                links.map((link, index) => (
                    <Link key={index} href={link.href} className={` p-2 pl-3 ${path === link.href ? "rounded-[6px] bg-[#f7f7f7FF] text-[#393939FF]" : "text-gray"}  leading-[22px]   flex font-medium gap-2 items-center `}>
                        {link.icon}
                        <span>{link.label}</span>
                    </Link>
                ))
            }

        </div>
    )
}

export default ResponsiveSidebar