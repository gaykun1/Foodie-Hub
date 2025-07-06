import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import RestaurantReducer from "./restaurantSlice";
import cartReducer from "./cartSlice";


export const store = configureStore({
    reducer:{
        auth:authReducer,
        cart:cartReducer,
        restaurants:RestaurantReducer
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;