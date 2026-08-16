"use client"
import {
    PaymentElement,
} from "@stripe/react-stripe-js";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";

export default function PaymentCard({ clientSecret }: { clientSecret: string }) {
    if (!clientSecret) return <PageSpinner />;

    return (
        <Card className="flex flex-col gap-4">
            <h2 className="text-2xl leading-8 font-bold text-ink">Payment</h2>
            <PaymentElement />
        </Card>
    );
}
