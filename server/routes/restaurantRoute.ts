

import express from "express";
import { createDish, createItem, createReview, deleteDish, getAbout, getDishes, getDishesNearYou, getFavouriteRestaurants, getLastSevenReviews, getRestaurantAddress, getRestaurantById, getRestaurantsFiltered, getReviews, getTopSevenDishes, handleAbout, searchRestaurants, toggleFavourite, } from "../controllers/restaurantController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { restaurantMiddleware } from "../middleware/restaurantMiddleware";
import { dashboardMiddleware } from "../middleware/dashboardMiddleware";

const restaurantRoute = express.Router();

// Must be logged in to open a restaurant; createItem itself links the caller
// to the new restaurant (role + restaurantId) since nothing else does.
restaurantRoute.post("/restaurants", authMiddleware, createItem);
restaurantRoute.get("/restaurants/filter", getRestaurantsFiltered);
restaurantRoute.get("/restaurants/search", searchRestaurants);
restaurantRoute.get("/restaurants/favourites", authMiddleware, getFavouriteRestaurants);
restaurantRoute.get("/dishes/nearby", getDishesNearYou);
restaurantRoute.post("/reviews", authMiddleware, createReview);
restaurantRoute.get("/restaurants/reviews/recent", adminMiddleware, getLastSevenReviews);
restaurantRoute.get("/restaurants/dishes/top", adminMiddleware, getTopSevenDishes);
// Mutating restaurant-management routes: admin or the owning restaurant account only
// (ownership itself is checked inside the controllers, since admins manage any restaurant).
restaurantRoute.post("/dishes", dashboardMiddleware, createDish);
restaurantRoute.get("/restaurants/:id/reviews/recent", restaurantMiddleware, getLastSevenReviews);
restaurantRoute.get("/restaurants/:id/dishes/top", restaurantMiddleware, getTopSevenDishes);
restaurantRoute.get("/restaurants/:title/address", getRestaurantAddress);
restaurantRoute.post("/restaurants/:id/favourite", authMiddleware, toggleFavourite);
restaurantRoute.post("/restaurants/:id/about", dashboardMiddleware, handleAbout);
restaurantRoute.get("/restaurants/:id/about", getAbout);
restaurantRoute.get("/restaurants/:id/reviews", getReviews);
restaurantRoute.get("/restaurants/:id", getRestaurantById);
restaurantRoute.get("/dishes/:id", getDishes);
restaurantRoute.delete("/dishes/:id", dashboardMiddleware, deleteDish);


export default restaurantRoute;


