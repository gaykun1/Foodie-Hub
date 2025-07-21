

import express from "express";
import { createDish, createItem, createReview, deleteDish, getAbout, getDishes, getDishesNearYou, getFavouriteRestaurants, getLastSevenReviews, getRestaurantAddress, getRestaurantById, getRestaurantsFiltered, getReviews, getTopSevenDishes, handleAbout, searchRestaurants, toggleToFavourite } from "../controllers/restaurantController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { restaurantMiddleware } from "../middleware/restaurantMiddleware";

const restaurantRoute = express.Router();

restaurantRoute.post("/restaurants", createItem);//
restaurantRoute.get("/restaurants/:id", getRestaurantById);//
restaurantRoute.get("/restaurants/:title/address", getRestaurantAddress);
restaurantRoute.post("/restaurants/filter", getRestaurantsFiltered);//
restaurantRoute.post("/restaurants/search", searchRestaurants);//
restaurantRoute.post("/add-to-favourite", authMiddleware, toggleToFavourite);
restaurantRoute.get("/dishes/:id", getDishes);
restaurantRoute.delete("/dishes/:id", deleteDish);
restaurantRoute.post("/dishes", createDish);
restaurantRoute.post("/about", handleAbout);
restaurantRoute.get("/about/:id", getAbout);
restaurantRoute.get("/reviews/:id", getReviews);
restaurantRoute.post("/reviews", authMiddleware, createReview);
restaurantRoute.get("/restaurants/favourites", authMiddleware, getFavouriteRestaurants);

restaurantRoute.get("/restaurants/reviews/top", adminMiddleware, getLastSevenReviews);
restaurantRoute.get("/restaurants/dishes/top", adminMiddleware, getTopSevenDishes);

restaurantRoute.get("/restaurants/:id/dishes/top", restaurantMiddleware, getLastSevenReviews);
restaurantRoute.get("/restaurants/:id/dishes/top", restaurantMiddleware, getTopSevenDishes);

restaurantRoute.get("/dishes/nearby", getDishesNearYou);



export default restaurantRoute;


