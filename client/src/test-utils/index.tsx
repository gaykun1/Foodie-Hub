import React from "react";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render, type RenderOptions } from "@testing-library/react";

import authReducer from "@/redux/authSlice";
import cartReducer from "@/redux/cartSlice";
import courierReducer from "@/redux/courierSlice";
import restaurantReducer from "@/redux/restaurantSlice";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Test helpers shared by the component suites.
 *
 * Components reach for the toast context and the Redux store, so rendering one
 * bare throws before the assertion is ever reached. This wraps both, and lets a
 * test describe the world it needs as plain preloaded state.
 */

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  courier: courierReducer,
  restaurants: restaurantReducer,
});

type TestRootState = ReturnType<typeof rootReducer>;

/**
 * Preloaded state is loosely typed on purpose: tests describe only the slice
 * they care about, and RTK's inferred PreloadedState would demand every field
 * of every slice for what is meant to be a one-line fixture.
 */
export const makeStore = (preloadedState: Record<string, unknown> = {}) =>
  configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as Partial<TestRootState>,
  });

/** Signed-in auth slice, ready to spread into preloaded state. */
export const authenticatedState = (overrides: Record<string, unknown> = {}) => ({
  user: {
    _id: "user-1",
    username: "TestUser",
    role: "user",
    email: "test@example.com",
    phoneNumber: "",
    favourites: [],
    address: { street: "", houseNumber: 0, city: "" },
    usualPromocode: { discountPercent: 0 },
    ...overrides,
  },
  isAuthenticated: true,
  status: "authenticated" as const,
});

/** Resolved-but-anonymous auth slice. */
export const guestState = () => ({
  user: null,
  isAuthenticated: false,
  status: "guest" as const,
});

export const renderWithProviders = (
  ui: React.ReactNode,
  {
    preloadedState = {},
    ...renderOptions
  }: { preloadedState?: Record<string, unknown> } & Omit<RenderOptions, "wrapper"> = {}
) => {
  const store = makeStore(preloadedState);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ToastProvider>{children}</ToastProvider>
    </Provider>
  );

  return { store, ...render(<>{ui}</>, { wrapper: Wrapper, ...renderOptions }) };
};
