"use client"

import Image from "next/image";
import { Order } from "@/redux/reduxTypes"
import { Ban, Calendar, MapPin, ReceiptText, User } from "lucide-react"
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

const ViewDetailsSideBar = ({ viewDetails }: { viewDetails: Order | null }) => {

    if (!viewDetails) {
        return (
            <Card>
                <EmptyState icon={<ReceiptText size={22} />} title="No order selected" description="Choose an order to see its details here." />
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex flex-col gap-1 pb-4 mb-6 border-b border-border">
                <h2 className='text-2xl leading-8 font-bold flex items-center gap-2 text-ink'>Order Details <ReceiptText /></h2>
                <p className='text-sm leading-5 text-inkMuted'>ID: {viewDetails._id}</p>
            </div>
            {viewDetails.status === "Cancelled" && (
                <div className="pb-4 mb-6 border-b border-border flex items-start gap-4 text-base leading-6 font-medium">
                    <Ban size={20} className="text-danger shrink-0" />
                    <div className="flex flex-col">
                        <span className="font-semibold text-danger">
                            Cancelled{viewDetails.cancelledBy ? ` by ${viewDetails.cancelledBy}` : ""}
                        </span>
                        {viewDetails.cancelReason && (
                            <span className="text-inkMuted text-sm">Reason: {viewDetails.cancelReason}</span>
                        )}
                        {viewDetails.refundedAt && (
                            <span className="text-inkMuted text-sm">Refunded {new Date(viewDetails.refundedAt).toDateString()}</span>
                        )}
                    </div>
                </div>
            )}
            <div className="pb-4 mb-6 border-b border-border flex flex-col gap-3">
                <div className="flex items-start gap-4 text-inkMuted text-base leading-6 font-medium">
                    <Calendar size={20} />
                    <div className="flex flex-col">
                        <span>Date:</span>
                        <span className='font-semibold text-ink'>{new Date(viewDetails.createdAt).toDateString()}</span>
                    </div>
                </div>
                <div className="flex items-start gap-4 text-inkMuted text-base leading-6 font-medium">
                    <User size={20} />
                    <div className="flex flex-col">
                        <span>Customer:</span>
                        <span className='font-semibold text-ink'>{viewDetails.fullName}</span>
                    </div>
                </div>

                <div className="flex items-start gap-4 text-inkMuted text-base leading-6 font-medium">
                    <MapPin size={20} />
                    <div className="flex flex-col">
                        <span>Delivery To:</span>
                        {/* Orders created but not yet checked out have no address yet. */}
                        <span className='font-semibold text-ink'>
                            {viewDetails.adress
                                ? `№${viewDetails.adress.apartmentNumbr != null ? viewDetails.adress.apartmentNumbr : "..."}, ${viewDetails.adress.houseNumber} ${viewDetails.adress.street}, ${viewDetails.adress.city}, ${viewDetails.adress.countryOrRegion}`
                                : "Not provided yet"}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <h2 className='text-lg leading-7 font-bold text-ink'>Order Items ({viewDetails.items.length})</h2>
                <div className="flex flex-col">
                    {viewDetails.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
                            <div className="flex items-center gap-4">
                                <div className="relative size-16 shrink-0 rounded-md overflow-hidden border border-border bg-sand-100">
                                    <Image className="object-cover" src={item.imageUrl} alt={item.title} fill sizes="64px" />
                                </div>
                                <div>
                                    <h3 className='text-base leading-6 font-semibold text-ink'>
                                        {item.title}
                                    </h3>
                                    <span className='text-sm leading-5 text-inkMuted'>Quantity: {item.amount}</span>
                                </div>
                            </div>
                            <div className="font-bold text-ink">${item.price.toFixed(2)}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col gap-2 text-base leading-6 font-medium">
                    <div className="flex items-center justify-between">
                        <span className="text-inkMuted">Shipping</span>
                        <span className="text-ink">${viewDetails.shippingPrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-inkMuted">Discount</span>
                        <span className={viewDetails.discountPercent > 0 ? "text-accent font-semibold" : "text-ink"}>{viewDetails.discountPercent}%</span>
                    </div>
                </div>
                <div className="mt-2 pt-3 border-t border-border text-lg leading-7 font-bold flex items-center justify-between text-ink">
                    <span>Total</span>
                    <span>${viewDetails.totalPrice.toFixed(2)}</span>
                </div>
            </div>
        </Card>
    )
}

export default ViewDetailsSideBar
