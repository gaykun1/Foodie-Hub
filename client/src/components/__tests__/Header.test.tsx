import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../redux/authSlice"
import cartReducer from "../../redux/cartSlice"
import Header from "../Header";
import axios from "axios";
import { act } from "react";

jest.mock("axios");
jest.mock("next/navigation", () => ({
    redirect: jest.fn(),
}));



const renderWithReduxState = (ui: React.ReactNode, preloadedState = {}) => {
    const store = configureStore({
        reducer: { auth: authReducer, cart: cartReducer },
        preloadedState,
    });

    return {
        ...render(<Provider store={store}>{ui}</Provider>),
        store,
    };
};
describe("Header component", () => {
    it("rendering logo", () => {
        renderWithReduxState(<Header />, {
            auth: { user: null },
            cart: { cart: { items: [] } },
        });

        expect(screen.getByAltText("logo")).toBeInTheDocument();
        expect(screen.getByText("Foodie Hub")).toBeInTheDocument();
    });

    it("showing username in the menu", () => {
     renderWithReduxState(<Header />, {
            auth: { user: { username: "TestUser", role: "user" } },
            cart: { cart: { items: [] } },
        });


        fireEvent.click(screen.getByRole("button", { name: /user/i }));

        expect(
            screen.getByText("Welcome back TestUser!")
        ).toBeInTheDocument();
    });

    it("logging out of the account", async () => {
        const { store } = renderWithReduxState(<Header />, {
            auth: { user: { username: "TestUser", role: "user" } },
            cart: { cart: { items: [] } },
        });

        fireEvent.click(screen.getByRole("button", { name: /user/i }));

        const logOutButton = screen.getByLabelText("log out");
        (axios.post as jest.Mock).mockResolvedValue({ data: {} });
        await act(async()=>{
        await fireEvent.click(logOutButton);
        })

        await waitFor(() => {
            expect(store.getState().auth.user).toBeNull();
        });

    })
    it("showing amount of products in the cart", () => {
        renderWithReduxState(<Header />, {
            auth: { user: null },
            cart: {
                cart: {
                    items: [
                        {
                            amount: 2,
                            dishId: { title: "Burger", imageUrl: "img", _id: "1" },
                        },
                    ],
                },
            },
        });
        expect(screen.getByTestId("cartLength")).toHaveTextContent("1");
    });

    it("opening cart with click", () => {
        renderWithReduxState(<Header />, {
            auth: { user: null },
            cart: {
                cart: {
                    items: [
                        {
                            amount: 1,
                            dishId: { title: "Pizza", imageUrl: "img", _id: "1" },
                        },
                    ],
                },
            },
        });


        fireEvent.click(screen.getByRole("button", { name: /cart/i }));

        expect(screen.getByText("Cart")).toBeInTheDocument();
        expect(screen.getByText("Pizza")).toBeInTheDocument();
    });
});
