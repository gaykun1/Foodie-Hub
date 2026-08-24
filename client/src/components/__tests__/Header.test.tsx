import { screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import Header from "../Header";
import { authApi } from "@/api";
import { renderWithProviders, authenticatedState, guestState } from "@/test-utils";
import { mockRouter } from "../../../jest.setup";

jest.mock("@/api", () => ({
    authApi: { logOut: jest.fn() },
    ordersApi: { createOrder: jest.fn() },
    cartApi: { updateCartAmount: jest.fn(), addToCart: jest.fn() },
    restaurantsApi: { searchRestaurants: jest.fn().mockResolvedValue([]) },
}));

describe("Header component", () => {
    it("rendering logo", () => {
        renderWithProviders(<Header />, {
            preloadedState: { auth: guestState(), cart: { cart: { items: [] } } },
        });

        expect(screen.getByAltText("FoodieHub")).toBeInTheDocument();
        expect(screen.getByText("FoodieHub")).toBeInTheDocument();
    });

    it("showing username in the menu", () => {
        renderWithProviders(<Header />, {
            preloadedState: { auth: authenticatedState(), cart: { cart: { items: [] } } },
        });

        fireEvent.click(screen.getByRole("button", { name: /user/i }));

        expect(screen.getByText("Welcome back TestUser!")).toBeInTheDocument();
    });

    it("logging out clears the session and returns to home rather than the login screen", async () => {
        (authApi.logOut as jest.Mock).mockResolvedValue(undefined);

        const { store } = renderWithProviders(<Header />, {
            preloadedState: { auth: authenticatedState(), cart: { cart: { items: [] } } },
        });

        fireEvent.click(screen.getByRole("button", { name: /user/i }));

        await act(async () => {
            fireEvent.click(screen.getByLabelText("log out"));
        });

        await waitFor(() => {
            expect(store.getState().auth.user).toBeNull();
        });
        // Signing out should leave a visitor somewhere they can keep browsing.
        expect(mockRouter.push).toHaveBeenCalledWith("/");
    });

    it("showing amount of products in the cart", () => {
        renderWithProviders(<Header />, {
            preloadedState: {
                auth: guestState(),
                cart: { cart: { items: [{ amount: 2, dishId: { title: "Burger", imageUrl: "img", _id: "1" } }] } },
            },
        });
        expect(screen.getByTestId("cartLength")).toHaveTextContent("1");
    });

    it("opening cart with click", () => {
        renderWithProviders(<Header />, {
            preloadedState: {
                auth: guestState(),
                cart: { cart: { items: [{ amount: 1, dishId: { title: "Pizza", imageUrl: "img", _id: "1" } }] } },
            },
        });

        fireEvent.click(screen.getByTestId("cart"));

        expect(screen.getByText("Cart")).toBeInTheDocument();
        expect(screen.getByText("Pizza")).toBeInTheDocument();
    });

    describe("guest browsing", () => {
        it("does not advertise account-only destinations to a signed-out visitor", () => {
            renderWithProviders(<Header />, {
                preloadedState: { auth: guestState(), cart: { cart: { items: [] } } },
            });

            expect(screen.getByRole("link", { name: "Discover" })).toBeInTheDocument();
            expect(screen.getAllByRole("link", { name: "Restaurants" }).length).toBeGreaterThan(0);
            expect(screen.queryByRole("link", { name: "My orders" })).not.toBeInTheDocument();
            expect(screen.queryByRole("link", { name: "Get a job" })).not.toBeInTheDocument();
        });

        it("shows account destinations once signed in", () => {
            renderWithProviders(<Header />, {
                preloadedState: { auth: authenticatedState(), cart: { cart: { items: [] } } },
            });

            expect(screen.getAllByRole("link", { name: "My orders" }).length).toBeGreaterThan(0);
        });

        it("a guest with a basket is prompted to sign in instead of placing the order", async () => {
            const { ordersApi } = jest.requireMock("@/api");

            renderWithProviders(<Header />, {
                preloadedState: {
                    auth: guestState(),
                    cart: { cart: { _id: "guest-cart", items: [{ amount: 1, dishId: { title: "Pizza", imageUrl: "img", _id: "1" } }] } },
                },
            });

            fireEvent.click(screen.getByTestId("cart"));
            const checkout = screen.getByRole("button", { name: /sign in to order/i });

            await act(async () => {
                fireEvent.click(checkout);
            });

            // No order is created for a guest; they are routed to log in and
            // sent back to where they were.
            expect(ordersApi.createOrder).not.toHaveBeenCalled();
            expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/auth/login?next="));
        });

        it("a signed-in customer can place the order straight from the cart", async () => {
            const { ordersApi } = jest.requireMock("@/api");
            ordersApi.createOrder.mockResolvedValue("order-123");

            renderWithProviders(<Header />, {
                preloadedState: {
                    auth: authenticatedState(),
                    cart: { cart: { _id: "cart-1", items: [{ amount: 1, dishId: { title: "Pizza", imageUrl: "img", _id: "1" } }] } },
                },
            });

            fireEvent.click(screen.getByTestId("cart"));

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: /place order/i }));
            });

            await waitFor(() => {
                expect(mockRouter.push).toHaveBeenCalledWith("/orders/order/order-123");
            });
        });
    });
});
