"use client"

import { useAppSelector } from "@/hooks/reduxHooks";
import { Order } from "@/redux/reduxTypes"
import axios from "axios";
import { Check, ChevronsRight } from "lucide-react";
import { useCallback, useState } from "react";
import OrderCard from "./order/OrderCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// Order card for the courier dashboard — reuses the shared OrderCard shell,
// swaps the action row for "take order" / "view details" depending on status.
const CourierOrderCard = ({ order, checkIfHasOrder, setViewDetails }: { order: Order, checkIfHasOrder: () => void, setViewDetails: React.Dispatch<React.SetStateAction<Order | null>>, }) => {
    const { courier } = useAppSelector(state => state.courier);
    const [taking, setTaking] = useState(false);
    const toast = useToast();

    const takeOrder = useCallback(async (id: string, courierId: string) => {
        try {
            setTaking(true);
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/courier/orders/${id}/take`, { id, courierId }, { withCredentials: true });
        } catch (err) {
            console.error(err);
            toast.error("Couldn't take this order. Please try again.");
        } finally {
            setTaking(false);
        }
    }, [toast]);

    const viewDetailsButton = (
        <Button variant="secondary" size="sm" icon={<ChevronsRight size={16} />} onClick={() => setViewDetails(order)}>
            View Details
        </Button>
    );

    let actions: React.ReactNode = viewDetailsButton;
    if (order.status === "Delivering") {
        actions = (
            <>
                <Button variant="outline" size="sm">Track order</Button>
                {viewDetailsButton}
            </>
        );
    } else if (order.status !== "Delivered" && courier) {
        actions = (
            <Button
                size="sm"
                variant="success"
                loading={taking}
                icon={<Check size={16} />}
                onClick={async () => {
                    await takeOrder(order._id, courier._id);
                    setViewDetails(order);
                    await checkIfHasOrder();
                }}
            >
                Take order
            </Button>
        );
    }

    return <OrderCard order={order} actions={actions} />;
}

export default CourierOrderCard
