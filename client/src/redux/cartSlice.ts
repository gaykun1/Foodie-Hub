import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Cart } from "./reduxTypes";

type initialStateType = {
    cart: Cart | null,
}

const initialState: initialStateType = {
    cart: null,
}
const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        getCart: (state, action: PayloadAction<Cart>) => {
            state.cart = action.payload;
        },
        updateAmount: (state, action: PayloadAction<{ dishId: string; amount: number }>) => {
            if (!state.cart) return;

            const item = state.cart.items.find(item => item.dishId._id === action.payload.dishId);
            if (item) {
                item.amount = action.payload.amount;
            }


        }
    }
})



export const { getCart, updateAmount } = cartSlice.actions;
export default cartSlice.reducer;