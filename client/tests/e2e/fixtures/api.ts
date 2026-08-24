import type { Page, Route } from "@playwright/test";

/**
 * A stubbed FoodieHub API for the end-to-end journey.
 *
 * The journey test drives the *real* Next.js app — real routing, real Redux,
 * real components — and only replaces the backend. That keeps the test stable
 * and secret-free (no Mongo, no Stripe keys, no seeded database), while still
 * exercising the thing that actually breaks: the front-end flow from discovery
 * through to live tracking.
 */

export const RESTAURANT = {
    _id: "rest-1",
    title: "Ember & Oak",
    description: "Wood-fired steaks and seasonal plates.",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    websiteUrl: "https://emberandoak.example.com",
    phone: "+380 44 201 3300",
    rating: 4.7,
    place: "Kyiv",
    categories: ["Fine Dining"],
    address: { city: "Kyiv", street: "Volodymyrska", houseNumber: "20" },
    location: { lat: 50.4547, lng: 30.5169 },
    startDay: "Monday",
    endDay: "Sunday",
    startHour: "12:00",
    endHour: "23:00",
    reviews: [],
};

export const DISH = {
    _id: "dish-1",
    title: "Oak-Fired Ribeye",
    description: "300g dry-aged ribeye, bone marrow butter, watercress.",
    price: 32,
    imageUrl: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800",
    typeOfFood: "Main Courses",
    sold: 388,
};

export const USER = {
    _id: "user-1",
    username: "demo",
    role: "user",
    email: "demo@foodiehub.example.com",
    phoneNumber: "+380 50 000 0001",
    favourites: [],
    address: { street: "Yaroslaviv Val", houseNumber: 15, city: "Kyiv" },
    usualPromocode: { discountPercent: 0 },
};

export const ORDER_ID = "order-1";

const baseOrder = {
    _id: ORDER_ID,
    restaurantTitle: RESTAURANT.title,
    restaurantImage: RESTAURANT.imageUrl,
    items: [{ title: DISH.title, price: DISH.price, amount: 1, imageUrl: DISH.imageUrl }],
    totalPrice: DISH.price,
    shippingPrice: 2.2,
    discountPercent: 0,
    approxTime: 30,
    createdAt: new Date().toISOString(),
    courierId: "courier-1",
    fullName: "Demo Customer",
    address: { city: "Kyiv", countryOrRegion: "Ukraine", street: "Yaroslaviv Val", houseNumber: 15 },
    route: {
        restaurant: { lat: 50.4547, lng: 30.5169 },
        customer: { lat: 50.4519, lng: 30.5116 },
    },
};

export interface ApiState {
    /** Flipped by signIn(); before that every account-scoped call 401s. */
    authenticated: boolean;
    /** Drives what /api/order/orders returns, so tracking can be asserted. */
    orderStatus: "Created" | "Preparing" | "Delivering" | "Delivered";
}

const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

const unauthorized = (route: Route) => json(route, { message: "Unauthorized (no token)" }, 401);

/**
 * Installs the stub. Returns the mutable state object so a test can flip the
 * visitor to signed-in, or advance the order, mid-journey.
 */
export const mockApi = async (page: Page): Promise<ApiState> => {
    const state: ApiState = { authenticated: false, orderStatus: "Created" };

    await page.route("**/api/**", async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname;
        const method = route.request().method();

        // ---- public catalogue -------------------------------------------
        if (path.endsWith("/api/restaurant/restaurants/filter")) {
            return json(route, [RESTAURANT]);
        }
        if (path.endsWith("/api/restaurant/restaurants/search")) {
            return json(route, [RESTAURANT]);
        }
        if (path.endsWith("/api/restaurant/dishes/nearby")) {
            return json(route, [{ ...DISH, restaurant: { _id: RESTAURANT._id, title: RESTAURANT.title, imageUrl: RESTAURANT.imageUrl } }]);
        }
        if (path.endsWith(`/api/restaurant/dishes/${RESTAURANT._id}`)) {
            return json(route, { ...RESTAURANT, dishes: [DISH] });
        }
        if (path.endsWith(`/api/restaurant/restaurants/${RESTAURANT._id}`)) {
            return json(route, RESTAURANT);
        }
        if (path.includes("/about")) return json(route, "We fire everything over oak.");
        if (path.includes("/reviews")) return json(route, { reviews: [], length: 1 });

        // ---- session -----------------------------------------------------
        if (path.endsWith("/api/auth/profile")) {
            return state.authenticated ? json(route, { user: USER }) : unauthorized(route);
        }
        if (path.endsWith("/api/auth/login")) {
            state.authenticated = true;
            return json(route, { user: USER });
        }
        if (path.endsWith("/api/auth/logout")) {
            state.authenticated = false;
            return json(route, {});
        }

        // ---- account-scoped ----------------------------------------------
        if (!state.authenticated) return unauthorized(route);

        if (path.endsWith("/api/cart/")) {
            return json(route, {
                _id: "cart-1",
                restaurantId: { title: RESTAURANT.title, imageUrl: RESTAURANT.imageUrl },
                items: [{ dishId: DISH, amount: 1 }],
            });
        }
        if (path.includes("/api/cart/items")) {
            return json(route, {});
        }
        if (path.endsWith("/api/order/orders") && method === "POST") {
            return json(route, ORDER_ID, 201);
        }
        if (path.endsWith("/api/order/orders") && method === "GET") {
            return json(route, [{ ...baseOrder, status: state.orderStatus }]);
        }
        if (path.endsWith(`/api/order/orders/${ORDER_ID}`)) {
            return json(route, { ...baseOrder, status: null, totalPrice: DISH.price });
        }
        if (path.endsWith("/api/address/addresses")) {
            return json(route, []);
        }
        if (path.endsWith("/api/payment/payment-intent")) {
            return json(route, { clientSecret: "pi_test_secret_placeholder" });
        }
        if (path.endsWith("/api/rating/orders/" + ORDER_ID + "/rating")) {
            return json(route, null, 404);
        }
        if (path.startsWith("/api/demo")) {
            return json(route, { simulationEnabled: false });
        }

        return json(route, {});
    });

    return state;
};
