/**
 * Client-side mirror of `server/utils/orderStatus.ts`.
 *
 * Kept as a separate file rather than imported across the client/server
 * boundary because the two packages have independent tsconfigs and build
 * pipelines; `server/tests/integration/orderStatus.test.ts` asserts the two
 * tables stay in step.
 */

export const ORDER_STATUSES = ["Created", "Preparing", "Delivering", "Delivered", "Cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);

export const TERMINAL_STATUSES: readonly OrderStatus[] = ["Delivered", "Cancelled"];

/** Statuses whose order is still moving and worth showing on the tracking map. */
export const ACTIVE_STATUSES: readonly OrderStatus[] = ["Created", "Preparing", "Delivering"];

export const isActiveStatus = (status: OrderStatus | null | undefined): boolean =>
  !!status && ACTIVE_STATUSES.includes(status);

export const isTerminalStatus = (status: OrderStatus | null | undefined): boolean =>
  !!status && TERMINAL_STATUSES.includes(status);

export type CancelActor = "customer" | "restaurant" | "admin";

export const CANCELLABLE_FROM: Record<CancelActor, readonly OrderStatus[]> = {
  customer: ["Created"],
  restaurant: ["Created", "Preparing"],
  admin: ["Created", "Preparing", "Delivering"],
};

export const canCancel = (status: OrderStatus | null | undefined, actor: CancelActor): boolean =>
  !!status && CANCELLABLE_FROM[actor].includes(status);

/** Copy shown to customers, keyed by status — replaces ad-hoc ternaries in views. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  Created: "Order placed",
  Preparing: "Being prepared",
  Delivering: "On the way",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

export const ORDER_STATUS_DESCRIPTION: Record<OrderStatus, string> = {
  Created: "We've sent your order to the kitchen and are waiting for them to accept it.",
  Preparing: "The restaurant is cooking your food right now.",
  Delivering: "Your courier has picked the order up and is on the way to you.",
  Delivered: "Your order arrived. Enjoy!",
  Cancelled: "This order was cancelled and the payment refunded.",
};

/** Badge tone per status, matching the `Badge` component's variants. */
export const ORDER_STATUS_TONE: Record<OrderStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  Created: "neutral",
  Preparing: "warning",
  Delivering: "info",
  Delivered: "success",
  Cancelled: "danger",
};

/** Zero-based position in the happy-path timeline; -1 for cancelled orders. */
export const ORDER_STATUS_STEP: Record<OrderStatus, number> = {
  Created: 0,
  Preparing: 1,
  Delivering: 2,
  Delivered: 3,
  Cancelled: -1,
};

/** The happy-path timeline, in order, for progress indicators. */
export const ORDER_TIMELINE: readonly OrderStatus[] = ["Created", "Preparing", "Delivering", "Delivered"];
