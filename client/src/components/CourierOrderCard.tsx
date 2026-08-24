"use client"

import { useAppSelector } from "@/hooks/reduxHooks";
import { Order } from "@/redux/reduxTypes"
import { courierApi } from "@/api";
import { errorMessage } from "@/lib/apiClient";
import { Check, ChevronsRight } from "lucide-react";
import { useCallback, useState } from "react";
import OrderCard from "./order/OrderCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// Order card for the courier dashboard — reuses the shared OrderCard shell,
// swaps the action row for "take order" / "view details" depending on status.
const CourierOrderCard = ({
    order,
    onTaken,
    setViewDetails,
}: {
    order: Order,
    /** Refetches the courier's assignment after a successful claim. */
    onTaken: () => void | Promise<void>,
    setViewDetails: React.Dispatch<React.SetStateAction<Order | null>>,
}) => {
    const { courier } = useAppSelector(state => state.courier);
    const [taking, setTaking] = useState(false);
    const toast = useToast();

    // The server resolves the acting courier from the auth cookie, so no id is
    // sent — passing one used to let any courier assign work to another.
    const takeOrder = useCallback(async (id: string): Promise<boolean> => {
        try {
            setTaking(true);
            await courierApi.takeOrder(id);
            return true;
        } catch (err) {
            console.error(err);
            toast.error(errorMessage(err, "Another courier may have taken this order first."));
            return false;
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
    if (order.status === "Preparing" && courier) {
        actions = (
            <>
                <Button
                    size="sm"
                    variant="success"
                    loading={taking}
                    icon={<Check size={16} />}
                    onClick={async () => {
                        // Only refresh once the claim actually succeeded —
                        // otherwise a lost race silently looked like a win.
                        if (await takeOrder(order._id)) {
                            setViewDetails(order);
                            await onTaken();
                        }
                    }}
                >
                    Take order
                </Button>
                {viewDetailsButton}
            </>
        );
    }

    return <OrderCard order={order} actions={actions} />;
}

export default CourierOrderCard
