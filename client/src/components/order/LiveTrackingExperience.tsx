"use client";

import dynamic from "next/dynamic";
import { Bike, Check, CheckCircle2, Home, MapPin, PackageCheck, Store } from "lucide-react";
import type { Socket } from "socket.io-client";

import type { Order } from "@/redux/reduxTypes";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const MapTracker = dynamic(() => import("@/components/order/MapTracker"), { ssr: false });

const milestones = [
  { status: "Created", label: "Order confirmed", icon: CheckCircle2 },
  { status: "Preparing", label: "Prepared & packed", icon: PackageCheck },
  { status: "Delivering", label: "Out for delivery", icon: Bike },
  { status: "Delivered", label: "Delivered", icon: Home },
] as const;

const statusIndex: Record<Order["status"], number> = {
  Created: 0,
  Preparing: 1,
  Delivering: 2,
  Delivered: 3,
  Cancelled: -1,
};

export function LiveTrackingExperience({ order, socket, courierLocation }: { order: Order; socket: Socket | null; courierLocation: [number, number] | null }) {
  const activeIndex = statusIndex[order.status];
  const isMoving = order.status === "Delivering";

  return (
    <section className="mb-8">
      <header className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand">Live delivery</p><h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{isMoving ? "Your dinner is on the way" : order.status === "Preparing" ? "The kitchen is preparing your order" : "Follow your order"}</h1><p className="mt-2 text-sm leading-6 text-inkMuted">Order #{order._id.slice(-8).toUpperCase()} from {order.restaurantTitle} to your door.</p></div>
        <span className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm font-bold text-ink">ETA · {order.approxTime || "—"} min</span>
      </header>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_22rem]">
        <Card padding="none" className="relative min-h-[560px] overflow-hidden shadow-elevation2">
          <div className="absolute inset-x-5 top-5 z-[500] flex items-center rounded-[var(--radius-md)] border border-border bg-surface/95 p-4 shadow-elevation3 backdrop-blur">
            <span className="flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-100 text-teal-800">{isMoving ? <Bike size={21} /> : <Store size={21} />}</span>
            <div className="ml-3"><p className="text-sm font-extrabold text-ink">{isMoving ? `Courier is about ${order.approxTime || "a few"} minutes away` : `${order.restaurantTitle} is working on your order`}</p><p className="mt-0.5 text-xs text-inkMuted">Live status updates appear here automatically</p></div>
            <span className="ml-auto rounded-full bg-teal-100 px-3 py-1.5 text-xs font-bold text-teal-800">{order.status}</span>
          </div>
          <div className="absolute inset-0"><MapTracker courierLocation={courierLocation} socket={socket} isWorking={order} /></div>
          <div className="absolute inset-x-5 bottom-5 z-[500] flex items-center rounded-[var(--radius-md)] border border-border bg-surface/95 p-4 shadow-elevation3 backdrop-blur">
            <span className="flex size-11 items-center justify-center rounded-full bg-ember-50 text-brand"><MapPin size={20} /></span>
            <div className="ml-3"><p className="text-sm font-extrabold text-ink">Delivery address</p><p className="mt-0.5 text-xs text-inkMuted">{order.adress.houseNumber} {order.adress.street}, {order.adress.city}</p></div>
            <span className="ml-auto flex items-center gap-2 text-xs font-bold text-teal-800"><span className="size-2 rounded-full bg-teal-600" />Live</span>
          </div>
        </Card>

        <aside className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-brand">Order #{order._id.slice(-8).toUpperCase()}</p><h2 className="mt-2 font-display text-xl font-extrabold text-ink">{order.restaurantTitle}</h2></div><span className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-ember-50 text-brand"><Store size={18} /></span></div>
            <div className="mt-6">
              {milestones.map((milestone, index) => { const Icon = milestone.icon; const done = index <= activeIndex; const active = index === activeIndex; return (
                <div key={milestone.status} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < milestones.length - 1 ? <span className={cn("absolute left-[17px] top-9 h-[calc(100%-30px)] w-px", index < activeIndex ? "bg-teal-600" : "bg-border")} /> : null}
                  <span className={cn("relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full", done ? "bg-teal-100 text-teal-800" : "bg-sand-100 text-inkSubtle")}><Icon size={17} /></span>
                  <div><p className={cn("text-sm font-bold", done ? "text-ink" : "text-inkMuted")}>{milestone.label}</p><p className="mt-1 text-xs text-inkSubtle">{active ? "Current status" : done ? "Completed" : "Up next"}</p></div>
                  {active ? <span className="ml-auto size-2 animate-pulse rounded-full bg-teal-600" /> : null}
                </div>
              ); })}
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between"><h2 className="font-display text-lg font-extrabold text-ink">Your order</h2><span className="text-xs font-bold text-brand">{order.items.length} items</span></div>
            <div className="mt-4 space-y-3 text-sm text-inkMuted">{order.items.slice(0, 4).map((item) => <div key={item.title} className="flex justify-between gap-3"><span className="truncate">{item.amount}× {item.title}</span><span className="shrink-0">${item.price.toFixed(2)}</span></div>)}</div>
            <div className="mt-4 flex justify-between border-t border-border pt-4 font-extrabold text-ink"><span>Total paid</span><span>${order.totalPrice.toFixed(2)}</span></div>
          </Card>
          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-teal-200 bg-teal-50 p-4 text-teal-800"><Check size={18} className="mt-0.5 shrink-0" /><p className="text-xs font-semibold leading-5">We’ll keep this page updated as the restaurant and courier move your order forward.</p></div>
        </aside>
      </div>
    </section>
  );
}
