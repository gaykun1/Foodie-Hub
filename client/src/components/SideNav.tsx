"use client"
import React from "react";
import { ChevronDown, FileUser, Heart, Home, ListOrdered, MapPin, Percent, Plus, SquareRoundCorner, User, Utensils } from "lucide-react"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDisclosure } from "@/hooks/useDisclosure";
import { cn } from "@/lib/cn";

export interface SideNavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

export const adminNavItems: SideNavItem[] = [
    { href: '/dashboard/overview', label: 'Dashboard Overview', icon: <Home size={18} /> },
    { href: '/dashboard/create', label: 'Add a Restaurant', icon: <Plus size={18} /> },
    { href: '/dashboard/promocode', label: 'Promocode Management', icon: <Percent size={18} /> },
    { href: '/dashboard/menu', label: 'Menu Management', icon: <Utensils size={18} /> },
    { href: '/dashboard/applications', label: 'Applications', icon: <FileUser size={18} /> },
];

export const restaurantNavItems: SideNavItem[] = [
    { href: '/dashboard/restaurant-overview', label: 'Restaurant overview', icon: <SquareRoundCorner size={18} /> },
    { href: '/dashboard/incoming-orders', label: 'Incoming orders', icon: <ListOrdered size={18} /> },
    { href: '/dashboard/add-dish', label: 'Add a Dish', icon: <Plus size={18} /> },
];

export const profileNavItems: SideNavItem[] = [
    { href: '/profile', label: 'Profile', icon: <User size={18} /> },
    { href: '/profile/addresses', label: 'Saved Addresses', icon: <MapPin size={18} /> },
    { href: '/profile/favourites', label: 'Favorite Restaurants', icon: <Heart size={18} /> },
];

const NavLink = ({ item, active, onClick }: { item: SideNavItem; active: boolean; onClick?: () => void }) => (
    <Link
        href={item.href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium leading-[22px] transition-colors",
            active ? "bg-brand text-onBrand" : "text-inkMuted hover:bg-surfaceRaised hover:text-ink"
        )}
    >
        {item.icon}
        <span>{item.label}</span>
    </Link>
);

// Section navigation used by both the dashboard and profile layouts — a
// desktop rail plus a mobile disclosure, replacing three previously
// near-identical components (Dashboard/SideBar, Profile/SideBar,
// Profile/ResponsiveSidebar) that re-declared the same link arrays.
export const SideNav = ({ items, className }: { items: SideNavItem[]; className?: string }) => {
    const path = usePathname();
    const { isOpen, toggle, close } = useDisclosure();
    const active = items.find((item) => item.href === path);

    return (
        <>
            <nav aria-label="Section navigation" className={cn("hidden lg:flex flex-col gap-1 w-[240px] shrink-0 border-r border-border p-3", className)}>
                {items.map((item) => (
                    <NavLink key={item.href} item={item} active={path === item.href} />
                ))}
            </nav>
            <div className="lg:hidden mb-4 w-full">
                {/* Names the section you are in. Previously a bare chevron with
                    no visible label, which gave no clue that it was navigation
                    at all. */}
                <button
                    onClick={toggle}
                    aria-expanded={isOpen}
                    aria-controls="sidenav-mobile-panel"
                    className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surfaceRaised cursor-pointer"
                >
                    <span className="flex items-center gap-2 min-w-0">
                        {active?.icon}
                        <span className="truncate">{active?.label ?? "Menu"}</span>
                    </span>
                    <ChevronDown size={18} className={cn("shrink-0 text-inkMuted transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                    <nav id="sidenav-mobile-panel" aria-label="Section navigation" className="flex flex-col gap-1 mt-2 rounded-lg border border-border bg-surface p-2">
                        {items.map((item) => (
                            <NavLink key={item.href} item={item} active={path === item.href} onClick={close} />
                        ))}
                    </nav>
                )}
            </div>
        </>
    );
};
