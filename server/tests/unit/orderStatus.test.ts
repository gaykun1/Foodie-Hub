import {
    ALLOWED_TRANSITIONS,
    ACTIVE_STATUSES,
    CANCELLABLE_FROM,
    NON_REVENUE_STATUSES,
    ORDER_STATUSES,
    REVENUE_STATUSES,
    TERMINAL_STATUSES,
    canCancel,
    canTransition,
    isActive,
    isOrderStatus,
    isTerminal,
    type OrderStatus,
} from "../../utils/orderStatus";

/**
 * The order lifecycle is the single most safety-relevant piece of shared
 * vocabulary in the app: the courier endpoint, the three cancellation
 * endpoints, the revenue reports and the client's timeline all derive from it.
 * These tests pin the whole table rather than the handful of paths the HTTP
 * tests happen to exercise.
 */
describe("order status state machine", () => {
    describe("isOrderStatus", () => {
        it.each([...ORDER_STATUSES])("accepts %s", (status) => {
            expect(isOrderStatus(status)).toBe(true);
        });

        it.each([
            ["a lowercase variant", "delivered"],
            ["an unknown word", "Shipped"],
            ["an empty string", ""],
            ["null", null],
            ["a number", 3],
            ["an object", {}],
        ])("rejects %s", (_label, value) => {
            expect(isOrderStatus(value)).toBe(false);
        });
    });

    describe("canTransition", () => {
        it("promotes a draft into a placed order and nothing else", () => {
            expect(canTransition(null, "Created")).toBe(true);
            for (const status of ORDER_STATUSES.filter((s) => s !== "Created")) {
                expect(canTransition(null, status)).toBe(false);
            }
        });

        it("walks the happy path one step at a time", () => {
            expect(canTransition("Created", "Preparing")).toBe(true);
            expect(canTransition("Preparing", "Delivering")).toBe(true);
            expect(canTransition("Delivering", "Delivered")).toBe(true);
        });

        it("refuses to skip a step", () => {
            expect(canTransition("Created", "Delivering")).toBe(false);
            expect(canTransition("Created", "Delivered")).toBe(false);
            expect(canTransition("Preparing", "Delivered")).toBe(false);
        });

        it("refuses to move backwards", () => {
            expect(canTransition("Delivering", "Preparing")).toBe(false);
            expect(canTransition("Preparing", "Created")).toBe(false);
            expect(canTransition("Delivered", "Delivering")).toBe(false);
        });

        it("refuses to leave a terminal state", () => {
            for (const terminal of TERMINAL_STATUSES) {
                for (const target of ORDER_STATUSES) {
                    expect(canTransition(terminal, target)).toBe(false);
                }
            }
        });

        it("never treats a status as a transition to itself", () => {
            for (const status of ORDER_STATUSES) {
                expect(canTransition(status, status)).toBe(false);
            }
        });

        it("has an entry for every status, so the table is total", () => {
            for (const status of ORDER_STATUSES) {
                expect(ALLOWED_TRANSITIONS[status]).toBeDefined();
            }
        });
    });

    describe("cancellation windows", () => {
        it("lets a customer cancel only before the kitchen starts", () => {
            expect(canCancel("Created", "customer")).toBe(true);
            expect(canCancel("Preparing", "customer")).toBe(false);
            expect(canCancel("Delivering", "customer")).toBe(false);
            expect(canCancel("Delivered", "customer")).toBe(false);
        });

        it("lets a restaurant cancel up to the point food leaves with a courier", () => {
            expect(canCancel("Created", "restaurant")).toBe(true);
            expect(canCancel("Preparing", "restaurant")).toBe(true);
            expect(canCancel("Delivering", "restaurant")).toBe(false);
        });

        it("lets an admin cancel anything not yet delivered", () => {
            expect(canCancel("Created", "admin")).toBe(true);
            expect(canCancel("Preparing", "admin")).toBe(true);
            expect(canCancel("Delivering", "admin")).toBe(true);
            expect(canCancel("Delivered", "admin")).toBe(false);
        });

        it("never allows cancelling an already-cancelled order, whoever asks", () => {
            for (const actor of ["customer", "restaurant", "admin"] as const) {
                expect(canCancel("Cancelled", actor)).toBe(false);
            }
        });

        it("never allows cancelling a draft, whoever asks", () => {
            for (const actor of ["customer", "restaurant", "admin"] as const) {
                expect(canCancel(null, actor)).toBe(false);
            }
        });

        it("grants each actor at least the window of the one before it", () => {
            // The windows are nested by design: anything a customer may cancel a
            // restaurant may too, and anything a restaurant may an admin may.
            for (const status of CANCELLABLE_FROM.customer) {
                expect(CANCELLABLE_FROM.restaurant).toContain(status);
            }
            for (const status of CANCELLABLE_FROM.restaurant) {
                expect(CANCELLABLE_FROM.admin).toContain(status);
            }
        });
    });

    describe("status groupings", () => {
        it("treats delivered and cancelled as terminal, and nothing else", () => {
            expect([...TERMINAL_STATUSES].sort()).toEqual(["Cancelled", "Delivered"]);
            for (const status of ORDER_STATUSES) {
                expect(isTerminal(status)).toBe(TERMINAL_STATUSES.includes(status));
            }
            expect(isTerminal(null)).toBe(false);
        });

        it("counts an order as active exactly while it is neither terminal nor a draft", () => {
            for (const status of ORDER_STATUSES) {
                expect(isActive(status)).toBe(!TERMINAL_STATUSES.includes(status));
            }
            expect(isActive(null)).toBe(false);
        });

        it("splits every status into exactly one of revenue or non-revenue", () => {
            const union = [...REVENUE_STATUSES, ...NON_REVENUE_STATUSES].sort();
            expect(union).toEqual([...ORDER_STATUSES].sort());
            for (const status of REVENUE_STATUSES) {
                expect(NON_REVENUE_STATUSES).not.toContain(status);
            }
        });

        it("excludes cancelled orders from revenue, since they were refunded", () => {
            expect(NON_REVENUE_STATUSES).toContain("Cancelled");
            // "Created" is placed but not yet fulfilled, so it isn't revenue yet.
            expect(NON_REVENUE_STATUSES).toContain("Created");
        });

        it("keeps ACTIVE_STATUSES consistent with the transition table", () => {
            // A status is active precisely when something can still follow it.
            for (const status of ORDER_STATUSES) {
                const hasSuccessor = ALLOWED_TRANSITIONS[status].length > 0;
                const cancellableByAnyone = (["customer", "restaurant", "admin"] as const)
                    .some((actor) => canCancel(status, actor));
                expect(ACTIVE_STATUSES.includes(status)).toBe(hasSuccessor || cancellableByAnyone);
            }
        });
    });

    describe("client mirror", () => {
        // client/src/lib/orderStatus.ts duplicates this vocabulary because the
        // two packages build independently. If they drift, the customer-facing
        // timeline silently disagrees with what the server will accept.
        const clientStatuses: OrderStatus[] = ["Created", "Preparing", "Delivering", "Delivered", "Cancelled"];
        const clientCancellableFrom: Record<"customer" | "restaurant" | "admin", OrderStatus[]> = {
            customer: ["Created"],
            restaurant: ["Created", "Preparing"],
            admin: ["Created", "Preparing", "Delivering"],
        };

        it("declares the same statuses as the client", () => {
            expect([...ORDER_STATUSES]).toEqual(clientStatuses);
        });

        it("declares the same cancellation windows as the client", () => {
            for (const actor of ["customer", "restaurant", "admin"] as const) {
                expect([...CANCELLABLE_FROM[actor]]).toEqual(clientCancellableFrom[actor]);
            }
        });
    });
});
