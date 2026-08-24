"use client"
import { useState } from "react";
import { ratingsApi } from "@/api";
import { errorMessage } from "@/lib/apiClient";
import { Star } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Order } from "@/redux/reduxTypes";
import { cn } from "@/lib/cn";

const StarPicker = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink">{label}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={label}>
            {Array.from({ length: 5 }).map((_, i) => (
                <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={i < value}
                    aria-label={`${i + 1} star${i === 0 ? "" : "s"}`}
                    onClick={() => onChange(i + 1)}
                    className="cursor-pointer text-brand"
                >
                    <Star size={22} className={cn(i < value && "fill-brand")} />
                </button>
            ))}
        </div>
    </div>
);

interface RateOrderModalProps {
    order: Order;
    open: boolean;
    onClose: () => void;
    onSubmitted: () => void;
}

const RateOrderModal = ({ order, open, onClose, onSubmitted }: RateOrderModalProps) => {
    const [restaurantRating, setRestaurantRating] = useState<number>(0);
    const [courierRating, setCourierRating] = useState<number>(0);
    const [comment, setComment] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const toast = useToast();

    const hasCourier = !!order.courierId;

    const submit = async () => {
        if (restaurantRating === 0) return;
        try {
            setSubmitting(true);
            await ratingsApi.createOrderRating(order._id, {
                restaurantRating,
                courierRating: hasCourier && courierRating > 0 ? courierRating : undefined,
                comment: comment.trim() || undefined,
            });
            toast.success("Thanks for your feedback!");
            onSubmitted();
            onClose();
        } catch (err) {
            console.error(err);
            // Surfaces "already rated" and similar server rules rather than a
            // generic retry prompt the customer can't act on.
            toast.error(errorMessage(err, "Couldn't submit your rating. Please try again."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Rate your order">
            <div className="flex flex-col gap-5">
                <StarPicker label={`How was ${order.restaurantTitle}?`} value={restaurantRating} onChange={setRestaurantRating} />
                {hasCourier && (
                    <StarPicker label="How was your delivery?" value={courierRating} onChange={setCourierRating} />
                )}
                <Textarea
                    id="rating-comment"
                    label="Comment (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us more..."
                    className="h-[100px] resize-none"
                />
                <Button loading={submitting} disabled={restaurantRating === 0} onClick={submit} fullWidth>
                    Submit rating
                </Button>
            </div>
        </Modal>
    );
};

export default RateOrderModal;
