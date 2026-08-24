"use client"
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks"
import { logout } from "@/redux/authSlice"
import { deleteItem, updateAmount } from "@/redux/cartSlice"
import { User } from "@/redux/reduxTypes"
import axios from "axios"
import { Menu, Minus, Plus, ShoppingCart, ShoppingBag, UserRound, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { redirect, usePathname } from "next/navigation"
import React, { useRef } from "react"
import { SearchCommand } from "./SearchCommand"
import { ThemeToggle } from "./ui/ThemeToggle"
import { Drawer } from "./ui/Drawer"
import { DropdownMenu, DropdownItem } from "./ui/DropdownMenu"
import { Button } from "./ui/Button"
import { EmptyState } from "./ui/EmptyState"
import { useDisclosure } from "@/hooks/useDisclosure"
import { useToast } from "./ui/Toast"
import { cn } from "@/lib/cn"

interface NavItem { href: string; label: string }

const getNavItems = (user: User | null): NavItem[] => {
  if (user?.role === "admin") return [{ href: "/dashboard/overview", label: "Dashboard" }];
  if (user?.role === "restaurant") return [{ href: "/dashboard/restaurant-overview", label: "Dashboard" }];
  return [
    { href: "/", label: "Discover" },
    { href: "/restaurants/category/all-restaurants", label: "Restaurants" },
    { href: "/orders", label: "My orders" },
    user?.role === "courier" ? { href: "/courier", label: "Courier page" } : { href: "/job", label: "Get a job" },
  ];
};

const Header = () => {
  const dispatch = useAppDispatch();
  const pathname = usePathname() ?? "/";
  const { user } = useAppSelector(state => state.auth);
  const { cart } = useAppSelector(state => state.cart);
  const toast = useToast();

  const cartDisclosure = useDisclosure();
  const avatarDisclosure = useDisclosure();
  const mobileNavDisclosure = useDisclosure();
  const avatarWrapperRef = useRef<HTMLDivElement>(null);

  const navItems = getNavItems(user);
  const cartCount = cart?.items.length ?? 0;

  const updateCount = async (amount: number, id: string, title: string) => {
    try {
      if (amount === 0) {
        dispatch(deleteItem(title));
      }
      dispatch(updateAmount({ amount, dishId: id }));
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/items/${id}`, { amount, title }, { withCredentials: true });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update the cart. Please try again.");
    }
  }

  const createOrder = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/order/orders`, { cart }, { withCredentials: true });
      if (res.data) return res.data;
    } catch (err) {
      console.error(err);
      toast.error("Couldn't place the order. Please try again.");
    }
  }

  const handleLogOut = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {}, { withCredentials: true });
      dispatch(logout());
      avatarDisclosure.close();
      redirect("/auth/login");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't log out. Please try again.");
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-border">
      <div className="_container flex items-center justify-between gap-4 h-[76px]">
        <Link href="/" className="flex gap-2 items-center group font-bold shrink-0">
          <Image className="transition-transform group-hover:rotate-90" width={40} height={40} src="/logo.svg" alt="FoodieHub" />
          <span className="text-xl font-display font-extrabold text-ink group-hover:text-brand transition-colors hidden sm:inline">FoodieHub</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold transition-colors", pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "bg-ember-50 text-brand" : "text-inkMuted hover:text-ink")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <SearchCommand />
          <ThemeToggle />

          <button
            data-testid="cart"
            onClick={cartDisclosure.open}
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            className="relative flex items-center justify-center size-10 rounded-full text-inkMuted hover:text-ink hover:bg-surfaceRaised transition-colors cursor-pointer"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span
                data-testid="cartLength"
                className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-brand text-onBrand text-[10px] font-bold leading-4 text-center"
              >
                {cartCount}
              </span>
            )}
          </button>

          <div ref={avatarWrapperRef} className="relative">
            <button
              aria-label="user"
              aria-haspopup="menu"
              aria-expanded={avatarDisclosure.isOpen}
              onClick={avatarDisclosure.toggle}
              className={cn(
                "flex items-center justify-center size-10 rounded-full border border-border transition-colors cursor-pointer",
                avatarDisclosure.isOpen ? "text-brand border-brand" : "text-inkMuted hover:text-ink"
              )}
            >
              {user?.username ? <span className="text-xs font-extrabold">{user.username.slice(0, 2).toUpperCase()}</span> : <UserRound size={20} />}
            </button>
            <DropdownMenu open={avatarDisclosure.isOpen} onClose={avatarDisclosure.close} anchorRef={avatarWrapperRef} align="right" className="min-w-[220px]">
              {user ? (
                <>
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <span className="text-sm font-bold text-ink">Welcome back {user.username}!</span>
                  </div>
                  <DropdownItem onClick={() => { avatarDisclosure.close(); redirect("/profile"); }}>
                    Profile
                  </DropdownItem>
                  <DropdownItem aria-label="log out" onClick={handleLogOut} className="text-danger">
                    <LogOut size={16} />
                    Log out
                  </DropdownItem>
                </>
              ) : (
                <>
                  <DropdownItem onClick={() => { avatarDisclosure.close(); redirect("/auth/login"); }}>
                    Log in
                  </DropdownItem>
                  <DropdownItem onClick={() => { avatarDisclosure.close(); redirect("/auth/register"); }}>
                    Sign up
                  </DropdownItem>
                </>
              )}
            </DropdownMenu>
          </div>

          <button
            aria-label="Open menu"
            aria-haspopup="menu"
            aria-expanded={mobileNavDisclosure.isOpen}
            onClick={mobileNavDisclosure.open}
            className="md:hidden flex items-center justify-center size-10 rounded-full text-inkMuted hover:text-ink hover:bg-surfaceRaised transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <Drawer open={mobileNavDisclosure.isOpen} onClose={mobileNavDisclosure.close} title="Menu">
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={mobileNavDisclosure.close}
              className="px-3 py-2.5 rounded-md text-sm font-semibold text-ink hover:bg-surfaceRaised transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Drawer>

      <Drawer
        open={cartDisclosure.isOpen}
        onClose={cartDisclosure.close}
        title="Cart"
        footer={
          cart?.items.length ? (
            <Button
              fullWidth
              size="lg"
              onClick={async () => {
                const id = await createOrder();
                if (id) {
                  cartDisclosure.close();
                  redirect(`/orders/order/${id}`);
                }
              }}
            >
              Place order
            </Button>
          ) : undefined
        }
      >
        {cart?.items.length ? (
          <div className="flex flex-col gap-3">
            {cart.items.map((item, idx) => (
              <div key={idx} className="flex gap-3 rounded-lg border border-border p-3">
                <div className="relative size-16 shrink-0 rounded-md overflow-hidden border border-border bg-sand-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.dishId.imageUrl} alt={item.dishId.title} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <h3 className="font-medium text-ink truncate">{item.dishId.title}</h3>
                  <div className="flex items-center gap-3">
                    <button
                      data-testid="lessAmount"
                      aria-label={`Decrease quantity of ${item.dishId.title}`}
                      onClick={() => updateCount(item.amount - 1, item.dishId._id, item.dishId.title)}
                      className="flex items-center justify-center size-8 rounded-md border border-border text-ink hover:bg-surfaceRaised transition-colors cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium text-ink w-4 text-center">{item.amount}</span>
                    <button
                      data-testid="moreAmount"
                      aria-label={`Increase quantity of ${item.dishId.title}`}
                      onClick={() => updateCount(item.amount + 1, item.dishId._id, item.dishId.title)}
                      className="flex items-center justify-center size-8 rounded-md border border-border text-ink hover:bg-surfaceRaised transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<ShoppingBag size={22} />} title="Cart is clear" description="Add a dish from any restaurant to get started." />
        )}
      </Drawer>
    </header>
  )
}
export default Header;
