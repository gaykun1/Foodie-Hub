

import express from "express";
import { createDish, createItem, createReview, deleteDish, getAbout, getDishes, getRestaurantById, getRestaurantsFiltered, getReviews, handleAbout, searchRestaurants, toggleToFavourite } from "../controllers/restaurantController";
import { authMiddleware } from "../middleware/authMiddleware";

const restaurantRoute = express.Router();

restaurantRoute.post("/create-restaurant", createItem);
restaurantRoute.get("/get-restaurant-by-id/:id", getRestaurantById);
restaurantRoute.post("/get-restaurants-filtered", getRestaurantsFiltered);
restaurantRoute.post("/search-restaurants", searchRestaurants);
restaurantRoute.post("/add-to-favourite", authMiddleware, toggleToFavourite);
restaurantRoute.get("/dishes/:id", getDishes);
restaurantRoute.delete("/dishes/:id", deleteDish);
restaurantRoute.post("/dishes", createDish);
restaurantRoute.post("/about", handleAbout);
restaurantRoute.get("/about/:id", getAbout);
restaurantRoute.get("/review/:id", getReviews);
restaurantRoute.post("/review", authMiddleware,createReview);


export default restaurantRoute;


