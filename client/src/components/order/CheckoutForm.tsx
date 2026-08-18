"use client"
import PaymentCard from "@/components/order/PaymentCard";
import { useAppSelector } from "@/hooks/reduxHooks"
import { useElements, useStripe } from "@stripe/react-stripe-js";
import axios from "axios";
import { Lock, Send, Bike, Zap, Clock3 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Order, Shipping } from "@/redux/reduxTypes";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { savePendingCheckout } from "@/utils/pendingCheckout";

// Letters plus spaces/hyphens/apostrophes/accents — the original
// /^[A-Za-z]+$/ rejected "New York", "Ivano-Frankivsk" and "O'Brien" in an
// app whose own country list is Ukraine/Poland/Germany.
const NAME_PATTERN = /^[\p{L}][\p{L}\s'-]*$/u;

type FormFields = {
    name: string,
    surname: string,
    city: string,
    countryOrRegion: string,
    street: string,
    houseNumber: string,
    apartmentNumbr?: string,
}

// ariaLabel values are part of the Playwright e2e contract (tests/e2e/cart.spec.ts
// selects the express option via getByLabel("express")) — keep them stable.
const SHIPPING_OPTIONS: { value: Shipping; label: string; eta: string; icon: typeof Bike; ariaLabel: string }[] = [
    { value: Shipping.Economy, label: "Economy Shipping", eta: "~50+ minutes", icon: Clock3, ariaLabel: "economy" },
    { value: Shipping.Standart, label: "Standard Shipping", eta: "~30-50 minutes", icon: Bike, ariaLabel: "standart" },
    { value: Shipping.Express, label: "Express Shipping", eta: "~15-30 minutes", icon: Zap, ariaLabel: "express" },
];

const CheckoutForm = ({ order, shipping, setShipping }: { order: Order, shipping: Shipping, setShipping: Dispatch<SetStateAction<Shipping>> }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<FormFields>()
    const router = useRouter();
    const { user } = useAppSelector(state => state.auth);
    const [clientSecret, setClientSecret] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const stripe = useStripe();
    const elements = useElements();
    const { cart } = useAppSelector(state => state.cart)
    const [promocode, setPromocode] = useState<string>("");
    const [discount, setDiscount] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [promoError, setPromoError] = useState<string | null>(null);

    const usePromocode = useCallback(async () => {
        try {
            setPromoError(null);
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/promocode/promocodes/${promocode}/use`, {}, { withCredentials: true });
            if (res.data) {
                setDiscount(res.data.discount + discount);
                setPromocode("");
            }
        } catch (err) {
            console.error(err);
            if (axios.isAxiosError(err) && err.response) {
                setPromoError(typeof err.response.data === "string" ? err.response.data : "That promocode isn't valid.");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [promocode]);

    const getClientSecret = useCallback(async () => {
        try {
            if (order) {
                // Server derives the charge amount from the pending order itself — it
                // won't trust a client-computed total (see server/utils/pricing.ts).
                const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/payment-intent`, { shipping, percent: discount }, { withCredentials: true });
                setClientSecret(res.data.clientSecret);
            }
        } catch (err) {
            console.error(err);
        }
    }, [order, shipping, discount]);

    useEffect(() => {
        getClientSecret();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [discount, shipping]);

    useEffect(() => {
        getClientSecret();
        if (user?.usualPromocode?.discountPercent)
            setDiscount(user.usualPromocode.discountPercent)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const onSubmit: SubmitHandler<FormFields> = async (formData) => {
        setLoading(true);
        setError(null);

        if (!stripe || !elements) {
            setLoading(false);
            return;
        }
        const { error: submitError } = await elements.submit();
        if (submitError && submitError.message) {
            setError(submitError.message);
            setLoading(false);
            return;
        }
        if (order) {
            // The order is only finalized (sent to the kitchen) once the success
            // page confirms this PaymentIntent actually succeeded — previously it
            // was finalized right here, before payment was even attempted, so a
            // declined card or an abandoned 3D Secure challenge still produced a
            // fully placed, unpaid order. Persisted so the success page can still
            // finalize it if Stripe has to redirect the browser away for that
            // challenge (a full navigation loses this component's state).
            savePendingCheckout(order._id, { formData, shipping, percent: discount, cartId: cart?._id });

            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/orders/order/success/${order._id}`
                },
                redirect: "if_required",
            });

            setLoading(false);
            if (confirmError) {
                if (confirmError.message) setError(confirmError.message);
                return;
            }

            // No redirect was needed (the common case for a plain card) — go finalize.
            router.push(`/orders/order/success/${order._id}?payment_intent=${paymentIntent?.id ?? ""}`);
        }
    }

    const total = (shipping + order.totalPrice) * ((100 - discount) / 100);

    return (
        <section className="flex flex-col md:flex-row gap-8 mt-10 md:items-start mb-12">
            <div className="md:basis-[700px] lg:basis-[886px] grow-0 flex flex-col gap-8">
                <Card>
                    <h2 className="text-2xl leading-8 font-bold text-ink">Your Details</h2>
                    <p className="text-inkMuted mt-1">{user?.email ? user.email : user?.username}</p>
                </Card>

                <Card>
                    <h2 className="text-2xl leading-8 font-bold text-ink mb-4">Delivery Information</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Select id="selectCountry" label="Country/Region" wrapperClassName="sm:col-span-2" {...register("countryOrRegion", { required: true })}>
                            <option value="Ukraine">Ukraine</option>
                            <option value="Poland">Poland</option>
                            <option value="Germany">Germany</option>
                        </Select>
                        <Input
                            id="checkout-name" label="Name" autoComplete="given-name" aria-label="name"
                            error={errors.name?.message}
                            {...register("name", { required: "Required", pattern: { value: NAME_PATTERN, message: "Please enter a valid name" } })}
                        />
                        <Input
                            id="checkout-surname" label="Surname" autoComplete="family-name" aria-label="surname"
                            error={errors.surname?.message}
                            {...register("surname", { required: "Required", pattern: { value: NAME_PATTERN, message: "Please enter a valid surname" } })}
                        />
                        <Input
                            id="checkout-city" label="City" autoComplete="address-level2" aria-label="city"
                            error={errors.city?.message}
                            {...register("city", { required: "Required", pattern: { value: NAME_PATTERN, message: "Please enter a valid city" } })}
                        />
                        <Input
                            id="checkout-street" label="Street" autoComplete="address-line1" aria-label="street"
                            error={errors.street?.message}
                            {...register("street", { required: "Required", pattern: { value: NAME_PATTERN, message: "Please enter a valid street" } })}
                        />
                        <Input
                            id="checkout-house-number" label="House number" autoComplete="off" aria-label="house-number"
                            error={errors.houseNumber?.message}
                            {...register("houseNumber", { required: "Required" })}
                        />
                        <Input
                            id="checkout-apartment" label="Apartment number" hint="Optional" autoComplete="off" aria-label="apartment-number"
                            {...register("apartmentNumbr")}
                        />
                    </div>
                </Card>

                <Card>
                    <h2 className="text-2xl leading-8 font-bold text-ink mb-3">Shipping Method</h2>
                    <div className="flex flex-col gap-3">
                        {SHIPPING_OPTIONS.map(({ value, label, eta, icon: Icon, ariaLabel }) => (
                            <label
                                key={value}
                                className={cn(
                                    "flex items-center justify-between gap-3 py-3 px-4 rounded-md border cursor-pointer transition-colors",
                                    shipping === value ? "border-brand bg-ember-50" : "border-border hover:bg-surfaceRaised"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        aria-label={ariaLabel}
                                        checked={shipping === value}
                                        onChange={() => setShipping(value)}
                                        type="radio"
                                        name="shipping"
                                        className="accent-brand cursor-pointer size-4"
                                    />
                                    <Icon size={18} className="text-brand shrink-0" />
                                    <div className="flex flex-col gap-0.5 text-sm font-medium">
                                        <span className="text-ink">{label}</span>
                                        <span className="text-inkMuted">{eta}</span>
                                    </div>
                                </div>
                                <span className="text-sm text-ink font-semibold">${value.toFixed(2)}</span>
                            </label>
                        ))}
                    </div>
                </Card>

                {order && (<PaymentCard clientSecret={clientSecret} />)}
            </div>

            <Card className="w-full md:w-auto py-10 px-6 lg:px-10">
                <h2 className="text-2xl leading-8 font-bold text-ink mb-5">Order Summary</h2>
                <div className="flex flex-col gap-6 pb-6 border-b border-border mb-6">
                    {order?.items.map((item, idx) => (
                        <div key={idx} className="flex items-center w-full justify-between gap-3">
                            <div className="flex gap-4 items-center min-w-0">
                                <div className="relative size-16 shrink-0 rounded-lg overflow-hidden border border-border bg-sand-100">
                                    <Image src={item.imageUrl} alt={item.title} fill sizes="64px" className="object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-medium text-ink truncate">{item.title}</h3>
                                    <p className="text-sm leading-5 text-inkMuted">Quantity: {item.amount}</p>
                                </div>
                            </div>
                            <p className="font-semibold text-ink shrink-0">${item.price.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-inkMuted">Subtotal</span>
                        <span className="text-ink">${order?.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-inkMuted">Shipping</span>
                        <span className="text-ink">${shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-inkMuted">Discount</span>
                        <span className={cn("text-ink", discount > 0 && "text-accent font-semibold")}>{discount}%</span>
                    </div>
                </div>
                <div className="mt-4 mb-6 text-lg leading-7 font-bold flex items-center justify-between text-ink">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor="promocode-input" className="text-sm font-medium text-ink">Promocode</label>
                    <div className="flex items-center gap-2">
                        <input
                            id="promocode-input"
                            value={promocode}
                            onChange={(e) => setPromocode(e.target.value)}
                            className="input h-10 px-3 flex-1"
                            type="text"
                            placeholder="FEAST20"
                        />
                        <Button variant="secondary" size="sm" aria-label="Apply promocode" icon={<Send size={16} />} onClick={usePromocode} />
                    </div>
                    {promoError && <span className="text-xs font-medium text-danger">{promoError}</span>}
                </div>
                <div className="w-full items-center flex flex-col gap-4 mt-6">
                    <Button
                        aria-label="place-order"
                        onClick={handleSubmit(onSubmit)}
                        loading={loading}
                        fullWidth
                        size="lg"
                        className="max-w-[328px]"
                    >
                        {loading ? "Processing..." : "Place Order"}
                    </Button>
                    <p className="text-xs leading-4 text-inkMuted flex items-center justify-center gap-1">
                        <Lock size={12} /> All transactions are secure and encrypted.
                    </p>
                    {error && <span className="text-sm font-medium text-danger">{error}</span>}
                </div>
            </Card>
        </section>
    )
}

export default CheckoutForm
