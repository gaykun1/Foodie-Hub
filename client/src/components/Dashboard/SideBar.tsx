
"use client"

import { BarChart, FileUser, Home, Plus, Settings, ShoppingCart, Utensils } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation";

const links = [
    { href: '/dashboard', label: 'Dashboard Overview', icon: <Home size={18} /> },
    { href: '/dashboard/create', label: 'Add a Restaurant', icon: <Plus size={18} /> },
    { href: '/dashboard/orders', label: 'Orders Management', icon: <ShoppingCart size={18} /> },
    { href: '/dashboard/menu', label: 'Menu Management', icon: <Utensils size={18} /> },
    { href: '/dashboard/applications', label: 'Applications', icon: <FileUser size={18} /> },
];
const SideBar = () => {
    const path = usePathname();
    return (
        <div className="basis-[255px] border-r-[1px] border-borderColor p-2 h-[900px] flex flex-col">
            {links.map((link, index) => (
                <Link key={index} href={link.href} className={` p-2 pl-3 ${(path === (link.href)) ? "rounded-[6px] text-white bg-primary" : "text-gray"}  leading-[22px]   flex font-medium gap-2 items-center `}>
                    {link.icon}
                    <span>{link.label}</span>
                </Link>
            ))}

        </div>
    )
}

export default SideBar