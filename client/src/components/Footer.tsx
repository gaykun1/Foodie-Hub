"use client";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { useAppSelector } from "@/hooks/reduxHooks";

interface FooterLink { href: string; label: string }

/**
 * Guests see only what they can actually reach. Advertising "Orders" or "My
 * profile" to a signed-out visitor just leads them to a wall, which is the
 * behaviour the guest-browsing work exists to remove.
 */
const getColumns = (isAuthenticated: boolean): { heading: string; links: FooterLink[] }[] => {
    const explore: FooterLink[] = [
        { href: "/", label: "Home" },
        { href: "/restaurants/category/all-restaurants", label: "Restaurants" },
    ];
    if (isAuthenticated) explore.push({ href: "/orders", label: "Orders" });

    const company: FooterLink[] = isAuthenticated
        ? [
            { href: "/job", label: "Become a courier" },
            { href: "/profile", label: "My profile" },
        ]
        : [
            { href: "/auth/login", label: "Log in" },
            { href: "/auth/register", label: "Create account" },
        ];

    return [
        { heading: "Explore", links: explore },
        { heading: "Company", links: company },
    ];
};

const socials = [
    { href: "https://instagram.com", label: "Instagram", icon: Instagram },
    { href: "https://facebook.com", label: "Facebook", icon: Facebook },
    { href: "https://twitter.com", label: "Twitter", icon: Twitter },
];

const Footer = () => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const columns = getColumns(isAuthenticated);

    return (
        <footer className="mt-auto border-t border-border bg-surface">
            <div className="_container py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
                <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
                    <Link href="/" className="flex items-center gap-2 font-bold w-fit">
                        <Image width={32} height={32} src="/logo.svg" alt="logo" />
                        <span className="font-display font-bold text-ink">Foodie Hub</span>
                    </Link>
                    <p className="text-sm text-inkMuted max-w-[220px]">
                        Local restaurants, delivered fast — your next favorite meal is a few taps away.
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        {socials.map(({ href, label, icon: Icon }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                className="flex items-center justify-center size-9 rounded-full border border-border text-inkMuted hover:text-brand hover:border-brand transition-colors"
                            >
                                <Icon size={16} />
                            </a>
                        ))}
                    </div>
                </div>

                {columns.map((col) => (
                    <nav key={col.heading} aria-label={col.heading} className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold text-ink">{col.heading}</h3>
                        <ul className="flex flex-col gap-2">
                            {col.links.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-inkMuted hover:text-ink transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ))}
            </div>
            <div className="border-t border-border">
                <div className="_container py-4 text-xs text-inkMuted">
                    © {new Date().getFullYear()} Foodie Hub. All rights reserved.
                </div>
            </div>
        </footer>
    )
}

export default Footer
