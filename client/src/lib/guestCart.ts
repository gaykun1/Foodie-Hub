import type { Cart, Dish } from "@/redux/reduxTypes";

/**
 * A cart for visitors who have not signed in.
 *
 * The server-side cart lives behind `authMiddleware`, so without this a guest
 * could not put anything in a basket at all — which would push the sign-in wall
 * all the way forward to "Add to cart" rather than to checkout, where it
 * belongs. Contents are kept in localStorage and merged into the real cart the
 * moment the visitor signs in (see `mergeGuestCartIntoAccount`).
 */

const STORAGE_KEY = "foodiehub:guestCart";

/** Synthetic id so guest carts are distinguishable from persisted ones. */
export const GUEST_CART_ID = "guest-cart";

export interface GuestCart {
  restaurant: { _id: string; title: string; imageUrl: string } | null;
  items: { dish: Dish; amount: number }[];
}

const empty: GuestCart = { restaurant: null, items: [] };

const isBrowser = () => typeof window !== "undefined";

export const readGuestCart = (): GuestCart => {
  if (!isBrowser()) return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as GuestCart;
    if (!parsed || !Array.isArray(parsed.items)) return empty;
    return parsed;
  } catch {
    return empty;
  }
};

const writeGuestCart = (cart: GuestCart): GuestCart => {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Private-browsing quota errors are not worth failing an add-to-cart over;
      // the in-memory Redux copy still reflects the change for this session.
    }
  }
  return cart;
};

export const clearGuestCart = () => {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

/**
 * Adds one unit of `dish`. Mirrors the server rule that a cart may only ever
 * contain dishes from a single restaurant — switching restaurants replaces the
 * basket rather than mixing the two.
 */
export const addGuestItem = (
  dish: Dish,
  restaurant: { _id: string; title: string; imageUrl: string }
): { cart: GuestCart; replacedRestaurant: boolean } => {
  const current = readGuestCart();
  const replacedRestaurant = !!current.restaurant && current.restaurant._id !== restaurant._id;
  const base: GuestCart = replacedRestaurant || !current.restaurant
    ? { restaurant, items: [] }
    : { ...current, restaurant };

  const existing = base.items.find((item) => item.dish._id === dish._id);
  const items = existing
    ? base.items.map((item) => (item.dish._id === dish._id ? { ...item, amount: item.amount + 1 } : item))
    : [...base.items, { dish, amount: 1 }];

  return { cart: writeGuestCart({ restaurant, items }), replacedRestaurant };
};

/** Sets an exact quantity; an amount of 0 removes the line entirely. */
export const setGuestAmount = (dishId: string, amount: number): GuestCart => {
  const current = readGuestCart();
  const items =
    amount <= 0
      ? current.items.filter((item) => item.dish._id !== dishId)
      : current.items.map((item) => (item.dish._id === dishId ? { ...item, amount } : item));
  return writeGuestCart({ restaurant: items.length ? current.restaurant : null, items });
};

/** Presents a guest cart in the same shape the rest of the app expects. */
export const toCartShape = (guest: GuestCart): Cart | null => {
  if (!guest.restaurant || guest.items.length === 0) return null;
  return {
    _id: GUEST_CART_ID,
    restaurantId: { title: guest.restaurant.title, imageUrl: guest.restaurant.imageUrl },
    items: guest.items.map((item) => ({ dishId: item.dish, amount: item.amount })),
  };
};

export const isGuestCart = (cart: Cart | null | undefined): boolean => cart?._id === GUEST_CART_ID;
