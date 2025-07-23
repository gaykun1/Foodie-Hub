
"use client"

import {Heart, User} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation";

const links = [
    { href: '/profile', label: 'Profile', icon: <User size={18} /> },
    { href: '/profile/favourites', label: 'Favorite Restaurants', icon: <Heart size={18} /> },
];
const SideBarProfile = () => {
    const path = usePathname();
    return (
        <div className="hidden  relative md:basis-[255px] border-[1px] rounded-lg border-borderColor p-4.5 gap-2   lg:flex flex-col">
            <div className="hidden lg:block">
                {links.map((link, index) => (
                    <Link key={index} href={link.href} className={` p-2 pl-3 ${path === link.href ? "rounded-[6px] bg-[#f7f7f7FF] text-[#393939FF]" : "text-gray"}  leading-[22px]   flex font-medium gap-2 items-center `}>
                        {link.icon}
                        <span>{link.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default SideBarProfile