"use client"
import { Box, ChevronDown, DollarSign, Utensils, ReceiptText, MessageSquareText, Flame } from 'lucide-react';
import Image from 'next/image';
import { Dish, Order, Review } from '@/redux/reduxTypes';
import { Rating } from '@/components/ui/Rating';
import { OrderStatusBadge, OrderStatus } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

type Metric = { number: number; percent: number } | null;

const timeAgo = (createdAt: Date) => {
    const minutes = Math.round((Date.now() - new Date(createdAt).getTime()) / 60000);
    return minutes > 60 ? `${Math.round(minutes / 60)} Hours ago` : `${minutes} Min. ago`;
};

const StatTile = ({ icon: Icon, label, value, metric, prefix = "" }: { icon: typeof Box; label: string; value: number; metric: Metric; prefix?: string }) => (
    <Card>
        <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-medium text-inkMuted">{label}</span>
            <Icon className="text-brand" size={16} />
        </div>
        <div className="flex flex-col">
            <span className="text-2xl leading-8 font-bold text-ink">{prefix}{value}</span>
            {metric !== null && (
                <span className="text-xs text-inkMuted">
                    {metric.percent > 0 ? "Up" : "Down"} {Math.abs(metric.percent)}% {label === "Total Revenue" ? "from last week" : "this week"}
                </span>
            )}
        </div>
    </Card>
);

interface DashboardOverviewViewProps {
    title: string;
    numOfOrders: Metric;
    totalRevenue: Metric;
    averageOrderValue: Metric;
    orders: Order[] | null;
    reviews: Review[] | null;
    topDishes: Dish[] | null;
    accordion: string | null;
    setAccordion: (updater: (prev: string | null) => string | null) => void;
}

const isKnownStatus = (status: string): status is OrderStatus =>
    ["Created", "Preparing", "Delivering", "Delivered", "Cancelled"].includes(status);

export const DashboardOverviewView = ({
    title, numOfOrders, totalRevenue, averageOrderValue, orders, reviews, topDishes, accordion, setAccordion,
}: DashboardOverviewViewProps) => {
    return (
        <div>
            <h1 className="section-title mb-8">{title}</h1>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <StatTile icon={Box} label="Total Orders" value={numOfOrders?.number ?? 0} metric={numOfOrders} />
                <StatTile icon={DollarSign} label="Total Revenue" value={totalRevenue?.number ?? 0} metric={totalRevenue} prefix="$" />
                <StatTile icon={Utensils} label="Avg. Order Value" value={averageOrderValue?.number ?? 0} metric={averageOrderValue} prefix="$" />
            </div>

            <div className="flex flex-col gap-6">
                <Card padding="none" className="px-6 py-8 flex flex-col gap-6">
                    <h2 className="text-xl leading-7 font-semibold text-ink">Recent Orders</h2>
                    {orders && orders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="text-sm text-inkMuted font-medium w-full min-w-[640px]">
                                <thead>
                                    <tr>
                                        <th className="text-start py-2.5">Order ID</th>
                                        <th className="text-start py-2.5">Customer</th>
                                        <th className="text-start py-2.5">Items</th>
                                        <th className="text-start py-2.5">Total</th>
                                        <th className="text-start py-2.5">Status</th>
                                        <th className="text-start py-2.5">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order._id} className="border-t border-border">
                                            <td className="text-ink py-4 px-1">{order._id}</td>
                                            <td className="py-4 px-1">{order.fullName}</td>
                                            <td className="py-4 px-1 flex flex-col">
                                                {order.items.map((item, idx) => (
                                                    <span key={idx}>{item.amount}x {item.title}{idx < order.items.length - 1 ? "," : ""}</span>
                                                ))}
                                            </td>
                                            <td className="py-4 px-1 text-ink">${order.totalPrice.toFixed(2)}</td>
                                            <td className="py-4 px-1">
                                                {isKnownStatus(order.status) ? <OrderStatusBadge status={order.status} /> : <Badge>{order.status}</Badge>}
                                            </td>
                                            <td className="py-4 px-1">{timeAgo(order.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState icon={<ReceiptText size={22} />} title="No recent orders" description="New orders will show up here as they come in." />
                    )}
                </Card>

                <div className="flex md:flex-row flex-col gap-6 md:items-start">
                    <Card padding="none" className="px-6 py-8 flex flex-col gap-4 md:basis-[550px] shrink-0">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl leading-7 font-semibold text-ink">Customer Feedback</h2>
                            <p className="text-sm text-inkMuted">Recent ratings and comments</p>
                        </div>
                        {reviews && reviews.length > 0 ? (
                            <div className="flex flex-col">
                                {reviews.map((review) => (
                                    <div key={review._id} className="py-4 border-b border-border last:border-b-0">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-sm font-semibold text-ink truncate">{review.sender?.username}</span>
                                                <Rating value={review.rating} size={14} />
                                            </div>
                                            <span className="text-xs font-medium text-inkMuted whitespace-nowrap">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            <button
                                                onClick={() => setAccordion((prev) => prev === review._id ? null : review._id)}
                                                aria-expanded={accordion === review._id}
                                                aria-label={accordion === review._id ? "Collapse review" : "Expand review"}
                                                className="p-1 rounded-full hover:bg-surfaceRaised transition-colors cursor-pointer"
                                            >
                                                <ChevronDown className={cn("text-ink transition-transform", accordion === review._id && "rotate-180")} size={16} />
                                            </button>
                                        </div>
                                        {accordion === review._id && (
                                            <div className="text-sm text-inkMuted pt-3 break-words">{review.text}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon={<MessageSquareText size={20} />} title="No reviews yet" />
                        )}
                    </Card>

                    <Card padding="none" className="px-6 py-8 flex flex-col gap-4 grow">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl leading-7 font-semibold text-ink">Top-Selling Dishes</h2>
                            <p className="text-sm text-inkMuted">Your most popular items by sales count</p>
                        </div>
                        {topDishes && topDishes.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {topDishes.map((dish) => (
                                    <div key={dish._id} className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-sand-100">
                                                <Image src={dish.imageUrl} alt={dish.title} fill sizes="48px" className="object-cover" />
                                            </div>
                                            <span className="text-ink truncate">{dish.title}</span>
                                        </div>
                                        <span className="px-2 py-1 text-brand text-xs font-semibold rounded-full bg-ember-100 whitespace-nowrap">{dish.sold} Sold</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon={<Flame size={20} />} title="No sales data yet" />
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
