import { act, screen, waitFor } from "@testing-library/react";
import RestaurantsByCategory from "../RestaurantsByCategory";
import { restaurantsApi } from "@/api";
import { renderWithProviders } from "@/test-utils";
import { AxiosError } from "axios";
import { Category, Restaurant } from "@/redux/reduxTypes";

jest.mock("@/api", () => ({
    restaurantsApi: { getRestaurantsFiltered: jest.fn() },
}));

const restaurant = (title: string): Restaurant => ({
    title,
    rating: 4.5,
    place: "Kyiv",
    categories: [],
    // next/image's default loader rejects a bare relative path like "img.jpg"
    // outright (it must start with "/" or be absolute), which crashes the
    // render entirely — RestaurantCard uses <Image>, unlike the plain <img>
    // tags elsewhere in the app.
    imageUrl: "/img.jpg",
    websiteUrl: "",
    phone: "",
    address: { city: "Kyiv", street: "Main", houseNumber: "1" },
    description: "d",
    _id: title,
    startDay: "Monday",
    endDay: "Sunday",
    startHour: "9:00",
    endHour: "22:00",
    reviews: [],
});

/**
 * Regression coverage for a bug found in manual QA: getRestaurantsFiltered
 * rejects with a 404 (not an empty array) when a category has zero matches —
 * see server/controllers/restaurantController.ts. The component previously
 * let that rejection skip both the redux update and the active-button state,
 * so switching to an empty category silently left the *previous* category's
 * restaurants on screen with the wrong button highlighted.
 */
describe("RestaurantsByCategory", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const notFound = () => {
        const err = new AxiosError("Not Found");
        err.response = { status: 404, data: { message: "Not Found!" }, statusText: "", headers: {}, config: {} as never };
        return err;
    };

    it("switches the highlighted category button even when the request 404s", async () => {
        (restaurantsApi.getRestaurantsFiltered as jest.Mock)
            .mockResolvedValueOnce([restaurant("All-Cafe")])
            .mockRejectedValueOnce(notFound());

        renderWithProviders(<RestaurantsByCategory />);

        await waitFor(() => expect(screen.getByText("All-Cafe")).toBeInTheDocument());

        await act(async () => {
            screen.getByRole("button", { name: "Desserts" }).click();
        });

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Desserts" })).toHaveAttribute("aria-pressed", "true");
            expect(screen.getByRole("button", { name: "All Restaurants" })).toHaveAttribute("aria-pressed", "false");
        });
    });

    it("shows the empty state instead of the previous category's stale restaurants", async () => {
        (restaurantsApi.getRestaurantsFiltered as jest.Mock)
            .mockResolvedValueOnce([restaurant("All-Cafe")])
            .mockRejectedValueOnce(notFound());

        renderWithProviders(<RestaurantsByCategory />);
        await waitFor(() => expect(screen.getByText("All-Cafe")).toBeInTheDocument());

        await act(async () => {
            screen.getByRole("button", { name: "Desserts" }).click();
        });

        await waitFor(() => {
            expect(screen.queryByText("All-Cafe")).not.toBeInTheDocument();
            expect(screen.getByText("No restaurants found")).toBeInTheDocument();
        });
    });

    it("shows a retryable error state on a genuine failure, not a silent no-op", async () => {
        const serverError = new AxiosError("Server error");
        serverError.response = { status: 500, data: {}, statusText: "", headers: {}, config: {} as never };

        (restaurantsApi.getRestaurantsFiltered as jest.Mock)
            .mockResolvedValueOnce([restaurant("All-Cafe")])
            .mockRejectedValueOnce(serverError);

        renderWithProviders(<RestaurantsByCategory />);
        await waitFor(() => expect(screen.getByText("All-Cafe")).toBeInTheDocument());

        await act(async () => {
            screen.getByRole("button", { name: "Fast Food" }).click();
        });

        await waitFor(() => {
            expect(screen.getByText("Couldn't load restaurants")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
        });
    });

    it("renders the fetched category on the happy path", async () => {
        (restaurantsApi.getRestaurantsFiltered as jest.Mock).mockResolvedValueOnce([
            restaurant("Sunny Diner"),
            restaurant("Rainy Bistro"),
        ]);

        renderWithProviders(<RestaurantsByCategory />);

        await waitFor(() => {
            expect(screen.getByText("Sunny Diner")).toBeInTheDocument();
            expect(screen.getByText("Rainy Bistro")).toBeInTheDocument();
        });
        expect(restaurantsApi.getRestaurantsFiltered).toHaveBeenCalledWith(Category.All);
    });
});
