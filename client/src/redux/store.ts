import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import RestaurantReducer from "./restaurantSlice";
import courierReducer from "./courierSlice";
import cartReducer from "./cartSlice";


export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        restaurants: RestaurantReducer,
        courier: courierReducer,
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;