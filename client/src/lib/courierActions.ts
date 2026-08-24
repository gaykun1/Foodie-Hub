import type { OrderStatus } from "@/lib/orderStatus";

/**
 * Which status a courier may move an order to next, mirroring the server's
 * `ALLOWED_TRANSITIONS` in `server/utils/orderStatus.ts`.
 *
 * The courier UI used to offer both "Delivering" and "Delivered" at all times
 * and disable them from ad-hoc string comparisons, which meant it could present
 * a transition the server would reject. Deriving the buttons from this table
 * keeps the two in step.
 */
export const ALLOWED_NEXT_BY_COURIER: Record<OrderStatus, readonly OrderStatus[]> = {
  // A courier only ever holds an order the kitchen has started, but "Created"
  // is listed for completeness so the table is total over OrderStatus.
  Created: ["Preparing"],
  Preparing: ["Delivering"],
  Delivering: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};
