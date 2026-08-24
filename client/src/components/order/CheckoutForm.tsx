"use client"
import PaymentCard from "@/components/order/PaymentCard";
import { useAppSelector } from "@/hooks/reduxHooks"
import { useElements, useStripe } from "@stripe/react-stripe-js";
import { addressesApi, paymentsApi, promocodesApi } from "@/api";
import { errorMessage } from "@/lib/apiClient";
import { StripeTestCardHint } from "@/components/order/StripeTestCardHint";
import { BadgeCheck, Lock, Send, Bike, Zap, Clock3, MapPin, Store } from "lucide-react";
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
import AddressPicker from "@/components/order/AddressPicker";
import { Address } from "@/redux/reduxTypes";

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
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormFields>()
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
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [useManualAddress, setUseManualAddress] = useState<boolean>(false);

    const applyAddress = useCallback((address: Address) => {
        setValue("countryOrRegion", address.countryOrRegion);
        setValue("city", address.city);
        setValue("street", address.street);
        setValue("houseNumber", String(address.houseNumber));
        setValue("apartmentNumbr", address.apartmentNumbr ? String(address.apartmentNumbr) : "");
    }, [setValue]);

    useEffect(() => {
        const getAddresses = async () => {
            try {
                const saved: Address[] = (await addressesApi.getAddresses()) ?? [];
                setAddresses(saved);
                if (saved.length > 0) {
                    const initial = saved.find(a => a.isDefault) ?? saved[0];
                    setSelectedAddressId(initial._id);
                    applyAddress(initial);
                } else if (user?.address?.city || user?.address?.street) {
                    // No saved addresses yet — prefill from the legacy single
                    // address on the profile as a starting point (no countryOrRegion
                    // there, so that field is left for the user to pick).
                    setValue("city", user.address.city ?? "");
                    setValue("street", user.address.street ?? "");
                    if (user.address.houseNumber) setValue("houseNumber", String(user.address.houseNumber));
                    setUseManualAddress(true);
                } else {
                    setUseManualAddress(true);
                }
            } catch (err) {
                console.error(err);
                setUseManualAddress(true);
            }
        }
        getAddresses();
        // Runs once on mount: the prefill is a starting point for this checkout,
        // and re-applying it when `user` later resolves would clobber whatever
        // the customer has already typed.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectAddress = (id: string) => {
        setSelectedAddressId(id);
        const address = addresses.find(a => a._id === id);
        if (address) applyAddress(address);
    };

    const applyPromocode = useCallback(async () => {
        if (!promocode.trim()) return;
        try {
            setPromoError(null);
            const granted = await promocodesApi.usePromocode(promocode.trim());
            // Functional update: `discount` is intentionally not a dependency, so
            // applying two codes in quick succession cannot drop the first one.
            setDiscount((current) => current + granted);
            setPromocode("");
        } catch (err) {
            console.error(err);
            setPromoError(errorMessage(err, "That promocode isn't valid."));
        }
    }, [promocode]);

    const getClientSecret = useCallback(async () => {
        try {
            if (order) {
                // Server derives the charge amount from the pending order itself — it
                // won't trust a client-computed total (see server/utils/pricing.ts).
                const { clientSecret: secret } = await paymentsApi.createPaymentIntent({ shipping, percent: discount });
                setClientSecret(secret);
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
        <section className="mt-8 mb-12">
            <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand">Secure checkout</p><h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">One last step to dinner</h1><p className="mt-2 text-sm leading-6 text-inkMuted">Review your order, delivery details, and payment before the kitchen starts cooking.</p></div>
                <span className="flex items-center gap-2 rounded-[var(--radius-md)] bg-teal-100 px-4 py-3 text-sm font-bold text-teal-800"><BadgeCheck size={18} />Encrypted payment</span>
            </header>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="flex min-w-0 flex-col gap-4">
                <Card>
                    <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-ember-50 text-brand"><Store size={20} /></span><div><h2 className="font-display text-lg font-extrabold text-ink">{order.restaurantTitle}</h2><p className="mt-0.5 text-xs text-inkMuted">Estimated delivery · {order.approxTime || "20–40"} min</p></div></div><span className="text-sm font-bold text-brand">{order.items.length} items</span></div>
                    <div className="mt-5 divide-y divide-border">
                        {order.items.map((item, idx) => (
                            <div key={`${item.title}-${idx}`} className="grid grid-cols-[4rem_minmax(0,1fr)_auto_auto] items-center gap-4 py-4">
                                <div className="relative size-16 overflow-hidden rounded-[var(--radius-md)] bg-sand-100"><Image src={item.imageUrl} alt={item.title} fill sizes="64px" className="object-cover" /></div>
                                <div className="min-w-0"><h3 className="truncate text-sm font-bold text-ink">{item.title}</h3><p className="mt-1 text-xs text-inkMuted">Quantity: {item.amount}</p></div>
                                <span className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-sm font-bold text-ink">× {item.amount}</span>
                                <p className="w-16 text-right text-sm font-extrabold text-ink">${item.price.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-ink">Delivery information</h2><p className="mt-1 text-sm text-inkMuted">Ordering as {user?.email || user?.username}</p></div><MapPin className="text-brand" size={20} /></div>
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
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
                    </div>

                    {!useManualAddress && addresses.length > 0 ? (
                        <AddressPicker
                            addresses={addresses}
                            selectedId={selectedAddressId}
                            onSelect={selectAddress}
                            onUseManual={() => setUseManualAddress(true)}
                        />
                    ) : (
                        <div className="flex flex-col gap-4">
                            {addresses.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setUseManualAddress(false)}
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline w-fit cursor-pointer"
                                >
                                    <MapPin size={14} /> Use a saved address
                                </button>
                            )}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Select id="selectCountry" label="Country/Region" wrapperClassName="sm:col-span-2" {...register("countryOrRegion", { required: true })}>
                                    <option value="Ukraine">Ukraine</option>
                                    <option value="Poland">Poland</option>
                                    <option value="Germany">Germany</option>
                                </Select>
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
                        </div>
                    )}
                </Card>

                <Card>
                    <h2 className="text-xl font-bold text-ink mb-1">Delivery speed</h2>
                    <p className="mb-4 text-sm text-inkMuted">Choose the timing that works for you.</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {SHIPPING_OPTIONS.map(({ value, label, eta, icon: Icon, ariaLabel }) => (
                            <label
                                key={value}
                                className={cn(
                                    "flex cursor-pointer flex-col gap-3 rounded-[var(--radius-md)] border p-4 transition-colors",
                                    shipping === value ? "border-brand bg-ember-50" : "border-border hover:bg-surfaceRaised"
                                )}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <input
                                        aria-label={ariaLabel}
                                        checked={shipping === value}
                                        onChange={() => setShipping(value)}
                                        type="radio"
                                        name="shipping"
                                        className="accent-brand cursor-pointer size-4"
                                    />
                                    <Icon size={19} className="text-brand shrink-0" />
                                </div>
                                <div className="flex flex-col gap-0.5 text-sm font-medium"><span className="text-ink">{label}</span><span className="text-xs text-inkMuted">{eta}</span></div>
                                <span className="text-sm text-ink font-semibold">${value.toFixed(2)}</span>
                            </label>
                        ))}
                    </div>
                </Card>

                <StripeTestCardHint />
                {order && (<PaymentCard clientSecret={clientSecret} />)}
            </div>

            <Card className="sticky top-24 w-full shadow-elevation3">
                <h2 className="font-display text-xl font-extrabold text-ink mb-5">Order summary</h2>
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
                <div className="my-5 border-t border-dashed border-border" />
                <div className="mb-6 flex items-end justify-between text-ink">
                    <span>Total</span>
                    <span className="font-display text-3xl font-extrabold">${total.toFixed(2)}</span>
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
                        <Button variant="secondary" size="sm" aria-label="Apply promocode" icon={<Send size={16} />} onClick={applyPromocode} />
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
                        className="max-w-none"
                    >
                        {loading ? "Processing..." : "Place Order"}
                    </Button>
                    <p className="text-xs leading-4 text-inkMuted flex items-center justify-center gap-1">
                        <Lock size={12} /> All transactions are secure and encrypted.
                    </p>
                    {error && <span className="text-sm font-medium text-danger">{error}</span>}
                </div>
            </Card>
            </div>
        </section>
    )
}

export default CheckoutForm
