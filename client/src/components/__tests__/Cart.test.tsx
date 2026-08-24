import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import Header from "../Header";
import DishCard from "../Dashboard/DishCard";
import { Dish } from "@/redux/reduxTypes";
import { cartApi } from "@/api";
import { renderWithProviders, authenticatedState, guestState } from "@/test-utils";
import { readGuestCart } from "@/lib/guestCart";

jest.mock("@/api", () => ({
    authApi: { logOut: jest.fn() },
    ordersApi: { createOrder: jest.fn() },
    cartApi: { addToCart: jest.fn(), updateCartAmount: jest.fn() },
    restaurantsApi: { searchRestaurants: jest.fn().mockResolvedValue([]), deleteDish: jest.fn() },
}));

const dish: Dish = {
    title: "Dish",
    description: "description",
    price: 32,
    imageUrl: "image.url",
    _id: "asdsadasd2312321sda",
    typeOfFood: "Desserts",
    sold: 4,
};

const restaurant = { _id: "rest-1", title: "Test Restaurant", imageUrl: "rest.url" };

const cartWith = (amount: number) => ({
    cart: {
        _id: "cart-1",
        restaurantId: { title: restaurant.title, imageUrl: restaurant.imageUrl },
        items: [{ amount, dishId: dish }],
    },
});

describe("testing cart", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("adding to cart item", async () => {
        (cartApi.addToCart as jest.Mock).mockResolvedValue({
            _id: "cart-1",
            restaurantId: { title: restaurant.title, imageUrl: restaurant.imageUrl },
            items: [{ dishId: dish, amount: 1 }],
        });

        renderWithProviders(
            <>
                <Header />
                <DishCard dish={dish} toCart={true} restaurant={restaurant} />
            </>,
            { preloadedState: { cart: { cart: null }, auth: authenticatedState() } }
        );

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
        });

        await waitFor(() => expect(screen.getByTestId("cartLength")).toHaveTextContent("1"));
    });

    describe("update amount item", () => {
        it("pressing +", async () => {
            const { store } = renderWithProviders(
                <>
                    <Header />
                    <DishCard dish={dish} toCart={true} restaurant={restaurant} />
                </>,
                { preloadedState: { cart: cartWith(2), auth: authenticatedState() } }
            );

            fireEvent.click(screen.getByTestId("cart"));

            await act(async () => {
                fireEvent.click(screen.getByTestId("moreAmount"));
            });

            await waitFor(() => {
                // `title` rides along because the server mirrors the change into
                // any in-progress order draft, which keys items by title.
                expect(cartApi.updateCartAmount).toHaveBeenCalledWith(dish._id, 3, dish.title);
            });
            await waitFor(() => {
                expect(store.getState().cart.cart?.items[0].amount).toBe(3);
            });
        });

        it("pressing -", async () => {
            const { store } = renderWithProviders(
                <>
                    <Header />
                    <DishCard dish={dish} toCart={true} restaurant={restaurant} />
                </>,
                { preloadedState: { cart: cartWith(2), auth: authenticatedState() } }
            );

            fireEvent.click(screen.getByTestId("cart"));

            await act(async () => {
                fireEvent.click(screen.getByTestId("lessAmount"));
            });

            await waitFor(() => {
                expect(cartApi.updateCartAmount).toHaveBeenCalledWith(dish._id, 1, dish.title);
            });
            await waitFor(() => {
                expect(store.getState().cart.cart?.items[0].amount).toBe(1);
            });
        });

        it("pressing - and deleting item out of the cart", async () => {
            const { store } = renderWithProviders(
                <>
                    <Header />
                    <DishCard dish={dish} toCart={true} restaurant={restaurant} />
                </>,
                { preloadedState: { cart: cartWith(1), auth: authenticatedState() } }
            );

            fireEvent.click(screen.getByTestId("cart"));

            await act(async () => {
                fireEvent.click(screen.getByTestId("lessAmount"));
            });

            await waitFor(() => {
                expect(cartApi.updateCartAmount).toHaveBeenCalledWith(dish._id, 0, dish.title);
            });
            await waitFor(() => {
                expect(store.getState().cart.cart?.items).toHaveLength(0);
            });
        });
    });

    describe("guest cart", () => {
        it("a logged-out visitor can add to a basket without hitting the server", async () => {
            const { store } = renderWithProviders(
                <>
                    <Header />
                    <DishCard dish={dish} toCart={true} restaurant={restaurant} />
                </>,
                { preloadedState: { cart: { cart: null }, auth: guestState() } }
            );

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
            });

            // The server cart is behind auth, so a guest basket must never call it.
            expect(cartApi.addToCart).not.toHaveBeenCalled();
            await waitFor(() => expect(screen.getByTestId("cartLength")).toHaveTextContent("1"));
            expect(store.getState().cart.cart?.items[0].dishId._id).toBe(dish._id);
        });

        it("persists the guest basket so it survives a reload", async () => {
            renderWithProviders(
                <>
                    <Header />
                    <DishCard dish={dish} toCart={true} restaurant={restaurant} />
                </>,
                { preloadedState: { cart: { cart: null }, auth: guestState() } }
            );

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
            });

            await waitFor(() => {
                const stored = readGuestCart();
                expect(stored.items).toHaveLength(1);
                expect(stored.restaurant?._id).toBe(restaurant._id);
            });
        });

        it("replaces the basket when a dish from a different restaurant is added", async () => {
            const otherDish: Dish = { ...dish, _id: "other-dish", title: "Other Dish" };
            const otherRestaurant = { _id: "rest-2", title: "Other Restaurant", imageUrl: "other.url" };

            const { rerender } = renderWithProviders(
                <>
                    <Header />
                    <DishCard dish={dish} toCart={true} restaurant={restaurant} />
                </>,
                { preloadedState: { cart: { cart: null }, auth: guestState() } }
            );

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
            });

            rerender(
                <>
                    <Header />
                    <DishCard dish={otherDish} toCart={true} restaurant={otherRestaurant} />
                </>
            );

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
            });

            // One restaurant per order, matching the server-side cart rule.
            await waitFor(() => {
                const stored = readGuestCart();
                expect(stored.restaurant?._id).toBe(otherRestaurant._id);
                expect(stored.items).toHaveLength(1);
                expect(stored.items[0].dish._id).toBe(otherDish._id);
            });
        });
    });
});
