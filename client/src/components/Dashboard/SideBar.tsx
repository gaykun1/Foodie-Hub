
"use client"

import { BarChart, FileUser, Home, ListOrdered, Percent, Plus, Settings, ShoppingCart, SquareRoundCorner, Utensils } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation";

const adminLinks = [
    { href: '/dashboard/overview', label: 'Dashboard Overview', icon: <Home size={18} /> },
    { href: '/dashboard/create', label: 'Add a Restaurant', icon: <Plus size={18} /> },
    { href: '/dashboard/promocode', label: 'Procomode Management', icon: <Percent size={18} /> },
    { href: '/dashboard/menu', label: 'Menu Management', icon: <Utensils size={18} /> },
    { href: '/dashboard/applications', label: 'Applications', icon: <FileUser size={18} /> },
];
const restaurantLinks = [
    { href: '/dashboard/restaurant-overview', label: 'Restaurant overview', icon: <SquareRoundCorner size={18} /> },
    { href: '/dashboard/incoming-orders', label: 'Incoming orders', icon: <ListOrdered size={18} /> },
    { href: '/dashboard/add-dish', label: 'Add a Dish', icon: <Plus size={18} /> },

];

const SideBar = ({ role }: { role: string }) => {
    const path = usePathname();
    return (
        <div className="basis-[255px] border-r-[1px] border-borderColor p-2 h-[900px] flex flex-col">
            {role === "admin" ? adminLinks.map((link, index) => (
                <Link key={index} href={link.href} className={` p-2 pl-3 ${(path === (link.href)) ? "rounded-[6px] text-white bg-primary" : "text-gray"}  leading-[22px]   flex font-medium gap-2 items-center `}>
                    {link.icon}
                    <span>{link.label}</span>
                </Link>
            )) : restaurantLinks.map((link, index) => (
                <Link key={index} href={link.href} className={` p-2 pl-3 ${(path === (link.href)) ? "rounded-[6px] text-white bg-primary" : "text-gray"}  leading-[22px]   flex font-medium gap-2 items-center `}>
                    {link.icon}
                    <span>{link.label}</span>
                </Link>
            ))}

        </div>
    )
}

export default SideBar