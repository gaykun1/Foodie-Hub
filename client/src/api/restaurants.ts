import { apiClient } from "@/lib/apiClient";
import type { Dish, Restaurant, Review } from "@/redux/reduxTypes";

export const getRestaurantsFiltered = async (categorie: string): Promise<Restaurant[]> => {
  if (!categorie) return [];
  const res = await apiClient.get(`/api/restaurant/restaurants/filter`, { params: { categorie } });
  return res.data;
};

export const searchRestaurants = async (chars: string): Promise<Restaurant[]> => {
  const res = await apiClient.get(`/api/restaurant/restaurants/search`, { params: { chars } });
  return res.data;
};

export const getRestaurantById = async (id: string): Promise<Restaurant> => {
  const res = await apiClient.get(`/api/restaurant/restaurants/${id}`);
  return res.data;
};

export interface RestaurantAddress {
  _id: string;
  address: { street: string; houseNumber: number; city: string };
  /** Present once the restaurant's coordinates have been resolved and stored. */
  location?: { lat: number; lng: number } | null;
}

export const getRestaurantAddress = async (title: string): Promise<RestaurantAddress> => {
  const res = await apiClient.get(`/api/restaurant/restaurants/${encodeURIComponent(title)}/address`);
  return res.data;
};

export const createRestaurant = async (payload: Record<string, unknown>): Promise<Restaurant> => {
  const res = await apiClient.post(`/api/restaurant/restaurants`, payload);
  return res.data;
};

export const getFavouriteRestaurants = async (): Promise<Restaurant[]> => {
  const res = await apiClient.get(`/api/restaurant/restaurants/favourites`);
  return res.data;
};

export const toggleFavourite = async (id: string): Promise<string[]> => {
  const res = await apiClient.post(`/api/restaurant/restaurants/${id}/favourite`, {});
  return res.data.favourites ?? res.data;
};

export const getAbout = async (id: string) => {
  const res = await apiClient.get(`/api/restaurant/restaurants/${id}/about`);
  return res.data;
};

export const saveAbout = async (id: string, about: string) => {
  const res = await apiClient.post(`/api/restaurant/restaurants/${id}/about`, { about });
  return res.data;
};

export const getReviews = async (id: string, page: number) => {
  const res = await apiClient.get(`/api/restaurant/restaurants/${id}/reviews`, { params: { page } });
  return res.data;
};

/** `id` is the restaurant id — that is the field name the server reads. */
export const createReview = async (payload: { id: string; text: string; rating: number }) => {
  const res = await apiClient.post(`/api/restaurant/reviews`, payload);
  return res.data;
};

export const getRecentReviews = async (restaurantId?: string): Promise<Review[]> => {
  const url = restaurantId
    ? `/api/restaurant/restaurants/${restaurantId}/reviews/recent`
    : `/api/restaurant/restaurants/reviews/recent`;
  const res = await apiClient.get(url);
  return res.data;
};

/**
 * Returns the restaurant document with its `dishes` populated — the menu page
 * needs the restaurant identity (for the cart) as well as the dish list, and
 * this endpoint already carries both.
 */
export interface RestaurantMenu {
  _id: string;
  title: string;
  imageUrl: string;
  dishes: Dish[];
}

export const getDishes = async (restaurantId: string): Promise<RestaurantMenu> => {
  const res = await apiClient.get(`/api/restaurant/dishes/${restaurantId}`);
  return res.data;
};

/**
 * A dish plus the restaurant it belongs to, so it can be added to a cart
 * straight from a mixed list where the restaurant is not otherwise known.
 */
export interface DishWithRestaurant extends Dish {
  restaurant: { _id: string; title: string; imageUrl: string };
}

/** Omitting `city` returns the platform-wide best sellers, which is what guests see. */
export const getDishesNearYou = async (city?: string): Promise<DishWithRestaurant[]> => {
  const res = await apiClient.get(`/api/restaurant/dishes/nearby`, {
    params: city ? { city } : undefined,
  });
  return res.data;
};

export const getTopDishes = async (restaurantId?: string): Promise<Dish[]> => {
  const url = restaurantId
    ? `/api/restaurant/restaurants/${restaurantId}/dishes/top`
    : `/api/restaurant/restaurants/dishes/top`;
  const res = await apiClient.get(url);
  return res.data;
};

export const createDish = async (payload: Record<string, unknown>): Promise<Dish> => {
  const res = await apiClient.post(`/api/restaurant/dishes`, payload);
  return res.data;
};

export const deleteDish = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/restaurant/dishes/${id}`);
};
