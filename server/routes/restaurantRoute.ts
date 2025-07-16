

import express from "express";
import { createDish, createItem, createReview, deleteDish, getAbout, getDishes, getDishesNearYou, getFavouriteRestaurants, getLastSevenReviews, getRestaurantAddress, getRestaurantById, getRestaurantsFiltered, getReviews, getTopSevenDishes, handleAbout, searchRestaurants, toggleToFavourite } from "../controllers/restaurantController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const restaurantRoute = express.Router();

restaurantRoute.post("/create-restaurant", createItem);
restaurantRoute.get("/get-restaurant-by-id/:id", getRestaurantById);
restaurantRoute.get("/get-restaurant-adress/:title", getRestaurantAddress);
restaurantRoute.post("/get-restaurants-filtered", getRestaurantsFiltered);
restaurantRoute.post("/search-restaurants", searchRestaurants);
restaurantRoute.post("/add-to-favourite", authMiddleware, toggleToFavourite);
restaurantRoute.get("/dishes/:id", getDishes);
restaurantRoute.delete("/dishes/:id", deleteDish);
restaurantRoute.post("/dishes", createDish);
restaurantRoute.post("/about", handleAbout);
restaurantRoute.get("/about/:id", getAbout);
restaurantRoute.get("/review/:id", getReviews);
restaurantRoute.post("/review", authMiddleware, createReview);
restaurantRoute.get("/favourites", authMiddleware, getFavouriteRestaurants);
restaurantRoute.get("/get-last-seven-reviews", adminMiddleware, getLastSevenReviews);
restaurantRoute.get("/get-top-seven-dishes", adminMiddleware, getTopSevenDishes);
restaurantRoute.get("/dishes-near-you", getDishesNearYou);



export default restaurantRoute;


