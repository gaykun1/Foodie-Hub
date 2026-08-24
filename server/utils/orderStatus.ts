/**
 * The single source of truth for order lifecycle states.
 *
 * These strings were previously repeated as inline literals across the order
 * controller, the courier controller, the socket layer and several `$nin`
 * filters, so a typo ("Delivered" vs "delivered") failed silently and the set
 * of legal transitions existed only as scattered `if` checks. Everything now
 * derives from the tables below.
 */

/** A draft order that exists only because checkout was opened; not yet placed. */
export const DRAFT_STATUS = null;

export const ORDER_STATUSES = ["Created", "Preparing", "Delivering", "Delivered", "Cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The status of a persisted order, including the pre-checkout draft state. */
export type OrderStatusOrDraft = OrderStatus | null;

export const isOrderStatus = (value: unknown): value is OrderStatus =>
    typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);

/** Statuses from which no further transition is possible. */
export const TERMINAL_STATUSES: readonly OrderStatus[] = ["Delivered", "Cancelled"];

export const isTerminal = (status: OrderStatusOrDraft): boolean =>
    status !== null && TERMINAL_STATUSES.includes(status);

/**
 * Legal forward transitions. Cancellation is deliberately *not* listed here —
 * it is authorised per-role by `CANCELLABLE_FROM` because who is cancelling
 * changes how late it is allowed to happen.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
    Created: ["Preparing"],
    Preparing: ["Delivering"],
    Delivering: ["Delivered"],
    Delivered: [],
    Cancelled: [],
};

export const canTransition = (from: OrderStatusOrDraft, to: OrderStatus): boolean => {
    // A draft becomes a real order exactly once, at successful checkout.
    if (from === null) return to === "Created";
    return ALLOWED_TRANSITIONS[from].includes(to);
};

export type CancelActor = "customer" | "restaurant" | "admin";

/**
 * How late each actor may still cancel:
 *  - customers, only before the kitchen starts cooking;
 *  - restaurants, up to the point the food leaves with a courier;
 *  - admins, any time before the order is finally delivered.
 */
export const CANCELLABLE_FROM: Record<CancelActor, readonly OrderStatus[]> = {
    customer: ["Created"],
    restaurant: ["Created", "Preparing"],
    admin: ["Created", "Preparing", "Delivering"],
};

export const canCancel = (status: OrderStatusOrDraft, actor: CancelActor): boolean =>
    status !== null && CANCELLABLE_FROM[actor].includes(status);

/** Statuses that represent money the business actually keeps. */
export const REVENUE_STATUSES: readonly OrderStatus[] = ["Preparing", "Delivering", "Delivered"];

/** Statuses excluded from revenue reporting (plus the `null` draft state). */
export const NON_REVENUE_STATUSES: readonly OrderStatus[] = ["Created", "Cancelled"];

/** An order the customer can still watch move on the live tracking map. */
export const ACTIVE_STATUSES: readonly OrderStatus[] = ["Created", "Preparing", "Delivering"];

export const isActive = (status: OrderStatusOrDraft): boolean =>
    status !== null && ACTIVE_STATUSES.includes(status);
