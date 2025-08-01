import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import cartReducer from "../../redux/cartSlice"
import authReducer from "../../redux/authSlice"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Header from "../Header";
import DishCard from "../Dashboard/DishCard";
import axios from "axios";
import { Dish } from "@/redux/reduxTypes";
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
const renderWithReduxState = (ui: React.ReactNode, preloadedState = {}) => {
    const store = configureStore({
        reducer: {
            cart: cartReducer,
            auth: authReducer,
        },
        preloadedState
    });
    return {

        ...render(
            <Provider store={store}>
                {ui}
            </Provider>
        ),
        store,
    }
}

describe("testing cart", () => {
    const dish: Dish = {
        title: "Dish",
        description: "description",
        price: 32,
        imageUrl: "image.url",
        _id: "asdsadasd2312321sda",
        typeOfFood: "Desserts",
        sold: 4,
    }

    it("adding to cart item", async () => {
        renderWithReduxState(<><Header /> <DishCard dish={dish} toCart={true} /></>, {
            cart: { cart: { items: [] } },
            auth: { user: null },
        });
        mockedAxios.post.mockResolvedValue({
            data: {
                items: [
                    { dishId: { title: "Dish" }, quantity: 1 }
                ]
            }
        });
        const addToCart = screen.getByRole("button", { name: /add to cart/i });
        await act(async () => {
            fireEvent.click(addToCart);


        })

        await waitFor(() =>
            expect(screen.getByTestId("cartLength")).toHaveTextContent("1")
        );

        jest.clearAllMocks();
    });
    describe("update amount item", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        })
        it("pressing +", async () => {
            const { store } = renderWithReduxState(<><Header /> <DishCard dish={dish} toCart={true} /></>, {
                cart: {
                    cart: {
                        items: [
                            {
                                amount: 2,
                                dishId: {
                                    title: "Dish",
                                    imageUrl: "image.url",
                                    _id: "asdsadasd2312321sda",
                                    price: 32,
                                    description: "description",
                                    typeOfFood: "Desserts",
                                    sold: 4,
                                },
                            },
                        ],
                    },
                },
                auth: { user: null },
            });
            fireEvent.click(screen.getByLabelText("cart"));
            mockedAxios.patch.mockResolvedValue({
                data: {},
            });

            const button = screen.getByTestId("moreAmount");
            await act(async () => {
                fireEvent.click(button);

            })


            await waitFor(() => {
                expect(mockedAxios.patch).toHaveBeenCalledWith(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/cart/items/asdsadasd2312321sda`,
                    { amount: 3, title: "Dish" },
                    { withCredentials: true }
                );
            });
            await waitFor(() => {
                expect(store.getState().cart.cart?.items[0].amount).toBe(3);
            }
            );



        });
        it("pressing -", async () => {
            const { store } = renderWithReduxState(<><Header /> <DishCard dish={dish} toCart={true} /></>, {
                cart: {
                    cart: {
                        items: [
                            {
                                amount: 2,
                                dishId: {
                                    title: "Dish",
                                    imageUrl: "image.url",
                                    _id: "asdsadasd2312321sda",
                                    price: 32,
                                    description: "description",
                                    typeOfFood: "Desserts",
                                    sold: 4,
                                },
                            },
                        ],
                    },
                },
                auth: { user: null },
            });
            fireEvent.click(screen.getByLabelText("cart"));
            mockedAxios.patch.mockResolvedValue({
                data: {},
            });

            const button = screen.getByTestId("lessAmount");
            await act(async () => {
                fireEvent.click(button);

            })


            await waitFor(() => {
                expect(mockedAxios.patch).toHaveBeenCalledWith(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/cart/items/asdsadasd2312321sda`,
                    { amount: 1, title: "Dish" },
                    { withCredentials: true }
                );
            });
            await waitFor(() => {
                expect(store.getState().cart.cart?.items[0].amount).toBe(1);
            }
            );



        });
        it("pressing - and deleting item out of the cart", async () => {
            const { store } = renderWithReduxState(<><Header /> <DishCard dish={dish} toCart={true} /></>, {
                cart: {
                    cart: {
                        items: [
                            {
                                amount: 1,
                                dishId: {
                                    title: "Dish",
                                    imageUrl: "image.url",
                                    _id: "asdsadasd2312321sda",
                                    price: 32,
                                    description: "description",
                                    typeOfFood: "Desserts",
                                    sold: 4,
                                },
                            },
                        ],
                    },
                },
                auth: { user: null },
            });
            fireEvent.click(screen.getByLabelText("cart"));
            mockedAxios.patch.mockResolvedValue({
                data: {},
            });

            const button = screen.getByTestId("lessAmount");
            await act(async () => {
                fireEvent.click(button);

            })


            await waitFor(() => {
                expect(mockedAxios.patch).toHaveBeenCalledWith(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/cart/items/asdsadasd2312321sda`,
                    { amount: 0, title: "Dish" },
                    { withCredentials: true }
                );
            });
            await waitFor(() => {
                expect(store.getState().cart.cart?.items).toHaveLength(0);
            }
            );



        })
    })


})