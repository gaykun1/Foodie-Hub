
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page"
import SignUpPage from "@/app/auth/register/page"
import { LogIn, SignUp } from "@/api/api";
jest.mock("axios");
const mockPush = jest.fn();
jest.mock("@/src/api/api", () => ({
    LogIn: jest.fn(),
    SignUp: jest.fn(),
}))
jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))
describe("auth components tests", () => {
    describe("login component", () => {
        it("Checking if 404 error works", async () => {
            render(<LoginPage />);
            fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456AS" } });
            (LogIn as jest.Mock).mockResolvedValue(404);
            await act(async () => {
                fireEvent.click(screen.getByText("Log in"));

            })
            await waitFor(() => {
                expect(LogIn).toHaveBeenCalledWith("123456AS", "testuser");
                expect(screen.getByTestId("error")).toBeInTheDocument();

            })

        }
        )

        it("200 if routing to /", async () => {
            render(<LoginPage />);
            fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456AS" } });
            (LogIn as jest.Mock).mockResolvedValue(200);
            await act(async () => {
                fireEvent.click(screen.getByText("Log in"));

            })
            await waitFor(() => {
                expect(LogIn).toHaveBeenCalledWith("123456AS", "testuser");
                expect(mockPush).toHaveBeenCalledWith("/");

            })

        }
        )

    })

    describe("sign up  component", () => {
        it("Checking if password is incorrect", async () => {
            render(<SignUpPage />);
            fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "12345678" } });
            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
            })
            await waitFor(() => {
                expect(SignUp).toHaveBeenCalledTimes(0);
                expect(screen.getByTestId("error")).toBeInTheDocument();

            })

        }
        )

        it("Checking if username is already taken", async () => {
            render(<SignUpPage />);
            fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "12345678Bb" } });
            (SignUp as jest.Mock).mockResolvedValue(403);
            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
            });
            await waitFor(() => {
                expect(SignUp).toHaveBeenCalledTimes(1);
                expect(screen.getByTestId("error2")).toBeInTheDocument();

            })

        }
        )

        it("200 if routing to /", async () => {
            render(<SignUpPage />);
            fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "12345678Aa" } });
            (SignUp as jest.Mock).mockResolvedValue(200);
            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

            })
            await waitFor(() => {
                expect(SignUp).toHaveBeenCalledWith("12345678Aa", "testuser");
                expect(mockPush).toHaveBeenCalledWith("/");

            })

        }
        )

    })
})