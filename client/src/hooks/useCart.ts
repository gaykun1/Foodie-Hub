"use client";
import { useCallback } from "react";
import { cartApi } from "@/api";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { getCart } from "@/redux/cartSlice";
import type { Dish } from "@/redux/reduxTypes";
import {
  addGuestItem,
  clearGuestCart,
  readGuestCart,
  setGuestAmount,
  toCartShape,
} from "@/lib/guestCart";

export interface CartRestaurant {
  _id: string;
  title: string;
  imageUrl: string;
}

/**
 * One cart API for components, regardless of whether the visitor is signed in.
 * Guests get a localStorage cart; signed-in users get the server cart. Callers
 * never branch on auth state themselves.
 */
export const useCart = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { cart } = useAppSelector((state) => state.cart);

  const refreshGuestCart = useCallback(() => {
    dispatch(getCart(toCartShape(readGuestCart())));
  }, [dispatch]);

  const addItem = useCallback(
    async (dish: Dish, restaurant: CartRestaurant): Promise<{ replacedRestaurant: boolean }> => {
      if (isAuthenticated) {
        const updated = await cartApi.addToCart(dish._id);
        dispatch(getCart(updated));
        return { replacedRestaurant: false };
      }
      const { cart: guest, replacedRestaurant } = addGuestItem(dish, restaurant);
      dispatch(getCart(toCartShape(guest)));
      return { replacedRestaurant };
    },
    [isAuthenticated, dispatch]
  );

  const setAmount = useCallback(
    async (dish: { _id: string; title: string }, amount: number): Promise<void> => {
      if (isAuthenticated) {
        await cartApi.updateCartAmount(dish._id, amount, dish.title);
        return;
      }
      dispatch(getCart(toCartShape(setGuestAmount(dish._id, amount))));
    },
    [isAuthenticated, dispatch]
  );

  return { cart, addItem, setAmount, refreshGuestCart, clearGuestCart };
};

/**
 * Replays a guest basket onto the freshly authenticated account's server cart,
 * then clears the local copy. Called once, right after the session resolves.
 *
 * Failures are swallowed deliberately: losing a not-yet-ordered guest basket is
 * a far better outcome than blocking sign-in on a cart write.
 */
export const mergeGuestCartIntoAccount = async (): Promise<boolean> => {
  const guest = readGuestCart();
  if (!guest.items.length) return false;
  try {
    for (const { dish, amount } of guest.items) {
      await cartApi.addToCart(dish._id);
      // addToCart only ever adds a single unit, so quantities above one need a
      // follow-up set rather than repeated posts.
      if (amount > 1) await cartApi.updateCartAmount(dish._id, amount, dish.title);
    }
    return true;
  } catch {
    return false;
  } finally {
    clearGuestCart();
  }
};
