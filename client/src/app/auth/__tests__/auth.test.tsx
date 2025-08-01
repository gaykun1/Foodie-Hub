import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/redux/authSlice"
import { Provider } from "react-redux";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page"
import SignUpPage from "@/app/auth/register/page"

import axios from "axios";
import {  LogIn, SignUp } from "@/api/api";
import { useRouter } from "next/navigation";
jest.mock("axios");
const mockPush = jest.fn();

const renderWithReduxState = (ui: React.ReactNode, preloadedState = {}) => {
    const store = configureStore({
        reducer: {
            auth: authReducer,
        },
        preloadedState
    });

    return {
        ...render(
            <Provider store={store}>{ui}</Provider>
        ),
        store
    }
}

const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock("@/src/api/api", () => ({
    LogIn: jest.fn(),
    SignUp:jest.fn(),
}))
jest.mock("next/navigation",()=>({
     useRouter: () => ({
    push: mockPush,
  }),
}))
describe("auth components tests", () => {
    describe("login component", () => {
        it("Checking if 404 error works", async() => {
            renderWithReduxState(<LoginPage />, {
                auth: { user: null },
            });
            fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456AS" } });
            (LogIn as jest.Mock).mockResolvedValue(404);
    await act(async()=>{
        fireEvent.click(screen.getByText("Log in"));

    })
            await waitFor(() => {
                expect(LogIn).toHaveBeenCalledWith("123456AS", "testuser");
                expect(screen.getByTestId("error")).toBeInTheDocument();

            })

        }
        )

            it("200 if routing to /", async() => {
           const {store} =  renderWithReduxState(<SignUpPage />, {
                auth: { user: null },
            });
            fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456AS" } });
            (LogIn as jest.Mock).mockResolvedValue(200);
    await act(async()=>{
        fireEvent.click(screen.getByText("Log in"));

    })
            await waitFor(() => {
                expect(LogIn).toHaveBeenCalledWith("123456AS", "testuser");
                expect(store.getState().auth.user?.username).toBe("testuser");
                expect(mockPush).toHaveBeenCalledWith("/");

            })

        }
        )

    })

      describe("sign up  component", () => {
        it("Checking if 404 error works", async() => {
            renderWithReduxState(<LoginPage />, {
                auth: { user: null },
            });
            fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456AS" } });
            (SignUp as jest.Mock).mockResolvedValue(404);
    await act(async()=>{
        fireEvent.click(screen.getByText("Log in"));

    })
            await waitFor(() => {
                expect(LogIn).toHaveBeenCalledWith("123456AS", "testuser");
                expect(screen.getByTestId("error")).toBeInTheDocument();

            })

        }
        )

         it("200 if routing to /", async() => {
           const {store} =  renderWithReduxState(<SignUpPage />, {
                auth: { user: null },
            });
            fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456AS" } });
            (LogIn as jest.Mock).mockResolvedValue(200);
    await act(async()=>{
        fireEvent.click(screen.getByText("Log in"));

    })
            await waitFor(() => {
                expect(LogIn).toHaveBeenCalledWith("123456AS", "testuser");
                expect(store.getState().auth.user?.username).toBe("testuser");
                expect(mockPush).toHaveBeenCalledWith("/");

            })

        }
        )

    })
})