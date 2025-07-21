

import express from "express";
import { createDish, createItem, createReview, deleteDish, getAbout, getDishes, getDishesNearYou, getFavouriteRestaurants, getLastSevenReviews, getRestaurantAddress, getRestaurantById, getRestaurantsFiltered, getReviews, getTopSevenDishes, handleAbout, searchRestaurants, toggleFavourite,  } from "../controllers/restaurantController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { restaurantMiddleware } from "../middleware/restaurantMiddleware";

const restaurantRoute = express.Router();

restaurantRoute.post("/restaurants", createItem);//
restaurantRoute.get("/restaurants/:id", getRestaurantById);//
restaurantRoute.get("/restaurants/:title/address", getRestaurantAddress);
restaurantRoute.get("/restaurants/filter", getRestaurantsFiltered);//
restaurantRoute.get("/restaurants/search", searchRestaurants);//
restaurantRoute.post("/restaurants/:id/favourite", authMiddleware, toggleFavourite);
restaurantRoute.get("/dishes/:id", getDishes);
restaurantRoute.delete("/dishes/:id", deleteDish);
restaurantRoute.post("/dishes", createDish);
restaurantRoute.post("restaurants/:id/about", handleAbout);
restaurantRoute.get(" /restaurants/:id/about", getAbout);
restaurantRoute.get("/restaurants/:id/reviews", getReviews);
restaurantRoute.post("/reviews", authMiddleware, createReview);
restaurantRoute.get("/restaurants/favourites", authMiddleware, getFavouriteRestaurants);
restaurantRoute.get("/restaurants/reviews/recent", adminMiddleware, getLastSevenReviews);
restaurantRoute.get("/restaurants/dishes/top", adminMiddleware, getTopSevenDishes);
restaurantRoute.get("/restaurants/:id/reviews/recent", restaurantMiddleware, getLastSevenReviews);
restaurantRoute.get("/restaurants/:id/dishes/top", restaurantMiddleware, getTopSevenDishes);
restaurantRoute.get("/dishes/nearby", getDishesNearYou);

export default restaurantRoute;


