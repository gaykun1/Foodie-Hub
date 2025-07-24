"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFavouriteRestaurants = exports.getReviews = exports.createReview = exports.deleteDish = exports.getDishes = exports.searchRestaurants = exports.toggleFavourite = exports.getRestaurantAddress = exports.getRestaurantById = exports.createDish = exports.getDishesNearYou = exports.getTopSevenDishes = exports.getLastSevenReviews = exports.getAbout = exports.handleAbout = exports.createItem = exports.getRestaurantsFiltered = void 0;
const Restaurant_1 = __importStar(require("../models/Restaurant"));
const User_1 = __importDefault(require("../models/User"));
const Dish_1 = __importDefault(require("../models/Dish"));
const Review_1 = __importDefault(require("../models/Review"));
const server_1 = require("../server");
const getRestaurantsFiltered = async (req, res) => {
    const categorie = req.query.categorie;
    try {
        if (categorie === Restaurant_1.Category.All) {
            const restaurants = await Restaurant_1.default.find({});
            res.status(200).json(restaurants);
            return;
        }
        const restaurants = await Restaurant_1.default.find({ categories: categorie });
        if (!restaurants) {
            res.status(404).json({ message: "Not Found!" });
            return;
        }
        res.status(200).json(restaurants);
        return;
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getRestaurantsFiltered = getRestaurantsFiltered;
const createItem = async (req, res) => {
    const restaurantData = req.body;
    try {
        const newRestaurant = new Restaurant_1.default({
            title: restaurantData.title,
            description: restaurantData.description,
            adress: {
                city: restaurantData.city,
                street: restaurantData.street,
                houseNumber: restaurantData.houseNumber,
            },
            phone: restaurantData.phone,
            websiteUrl: restaurantData.websiteUrl,
            imageUrl: restaurantData.imageUrl,
            categories: restaurantData.categories,
            startDay: restaurantData.startDay,
            endDay: restaurantData.endDay,
            startHour: restaurantData.startHour,
            endHour: restaurantData.endHour,
        });
        await newRestaurant.save();
        res.status(201).json(newRestaurant);
        return;
    }
    catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
exports.createItem = createItem;
const handleAbout = async (req, res) => {
    const { info } = req.body;
    const id = req.params.id;
    try {
        const restaurant = await Restaurant_1.default.findById(id);
        if (restaurant) {
            restaurant.about = info;
            await restaurant.save();
        }
        res.status(201).json(restaurant?.about);
        return;
    }
    catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
exports.handleAbout = handleAbout;
const getAbout = async (req, res) => {
    const id = req.params.id;
    try {
        const restaurant = await Restaurant_1.default.findById(id);
        if (restaurant) {
            res.status(201).json(restaurant?.about);
            return;
        }
        res.status(404).json("Not Found!");
        return;
    }
    catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
exports.getAbout = getAbout;
// func for getting last seven reviews
const getLastSevenReviews = async (req, res) => {
    const id = req.params.id;
    try {
        if (id == null) {
            const reviews = await Review_1.default.find().populate({ path: "sender", select: "username" }).sort({ updatedAt: -1 }).limit(7);
            if (!reviews) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(reviews);
            return;
        }
        else {
            const reviews = await Review_1.default.find({ restaurantId: id }).populate({ path: "sender", select: "username" }).sort({ updatedAt: -1 }).limit(7);
            if (!reviews) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(reviews);
            return;
        }
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.getLastSevenReviews = getLastSevenReviews;
const getTopSevenDishes = async (req, res) => {
    const id = req.params.id;
    try {
        // if id is not null than its for restaurant otherwise admin
        if (id == null) {
            const topDishes = await Dish_1.default.find().sort({ sold: -1 }).limit(7);
            if (!topDishes) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(topDishes);
            return;
        }
        else {
            // sorting top by most sold items
            const topDishes = await Dish_1.default.find({ restaurantId: id }).sort({ sold: -1 }).limit(7);
            if (!topDishes) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(topDishes);
            return;
        }
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.getTopSevenDishes = getTopSevenDishes;
const getDishesNearYou = async (req, res) => {
    console.log("[getDishesNearYou] start");
    const city = req.query.city;
    console.log("[getDishesNearYou] city:", city);
    try {
        const restaurants = await Restaurant_1.default.find({ "adress.city": city }).populate("dishes");
        console.log("[getDishesNearYou] restaurants:", restaurants);
        let dishes = [];
        restaurants.forEach((item) => {
            dishes.push(...item.dishes);
        });
        const newDishes = dishes.sort((a, b) => b.sold - a.sold).slice(0, 5);
        console.log("[getDishesNearYou] newDishes:", newDishes);
        res.status(200).json(newDishes);
    }
    catch (err) {
        console.error("[getDishesNearYou] error:", err);
        res.status(500).json("Server error!");
    }
};
exports.getDishesNearYou = getDishesNearYou;
const createDish = async (req, res) => {
    const { dish, id } = req.body;
    try {
        const newDish = new Dish_1.default({
            title: dish.title,
            description: dish.description,
            imageUrl: dish.imageUrl,
            price: dish.price,
            restaurantId: id,
            typeOfFood: dish.typeOfFood,
        });
        await newDish.save();
        if (newDish) {
            const restaurant = await Restaurant_1.default.findById(id);
            if (restaurant) {
                restaurant.dishes.push(newDish._id);
                await restaurant.save();
            }
            res.status(201).json(newDish);
            return;
        }
        res.status(404).json("Not found!");
        return;
    }
    catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
exports.createDish = createDish;
const getRestaurantById = async (req, res) => {
    const id = req.params.id;
    try {
        const restaurant = await Restaurant_1.default.findOne({ _id: id }).select("-_id");
        if (!restaurant) {
            res.status(404).json({
                message: "Not found!",
            });
            return;
        }
        res.status(200).json(restaurant);
        return;
    }
    catch {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
exports.getRestaurantById = getRestaurantById;
const getRestaurantAddress = async (req, res) => {
    const title = req.params.title;
    try {
        const restaurant = await Restaurant_1.default.findOne({ title: title }).select("adress");
        if (!restaurant) {
            res.status(404).json({
                message: "Not found!",
            });
            return;
        }
        res.status(200).json(restaurant);
        return;
    }
    catch {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
exports.getRestaurantAddress = getRestaurantAddress;
const toggleFavourite = async (req, res) => {
    const restaurantId = req.params.id;
    try {
        const user = await User_1.default.findById(req.userId);
        if (user) {
            const index = user.favourites.indexOf(restaurantId);
            if (index > -1) {
                user.favourites.splice(index, 1);
            }
            else {
                user.favourites.push(restaurantId);
            }
            await user.save();
            res.status(200).json(user.favourites);
            return;
        }
        res.status(404).json("Not found!");
        return;
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
exports.toggleFavourite = toggleFavourite;
const searchRestaurants = async (req, res) => {
    const { chars } = req.query;
    try {
        const restaurants = await Restaurant_1.default.find({ title: { $regex: chars, $options: 'i' } }).limit(5);
        res.json(restaurants);
        return;
    }
    catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
};
exports.searchRestaurants = searchRestaurants;
const getDishes = async (req, res) => {
    const id = req.params.id;
    try {
        const dishes = await Restaurant_1.default.findById(id).populate({ path: "dishes" }).select("dishes");
        res.json(dishes);
        return;
    }
    catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
};
exports.getDishes = getDishes;
const deleteDish = async (req, res) => {
    const id = req.params.id;
    try {
        const dish = await Dish_1.default.findByIdAndDelete(id);
        if (!dish) {
            res.status(404).json({ error: "Dish not found" });
            return;
        }
        const restaurant = await Restaurant_1.default.findById(dish?.restaurantId);
        if (!restaurant) {
            res.status(404).json({ error: "Dish not found" });
            return;
        }
        restaurant.dishes = restaurant.dishes.filter(d => !d.equals(dish._id));
        await restaurant.save();
        res.status(200).json("Deleted!");
        return;
    }
    catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
};
exports.deleteDish = deleteDish;
// creating review and recalculating rating of Restaurant
const createReview = async (req, res) => {
    const { id, text, rating } = req.body;
    console.log(req.body);
    try {
        const newReview = new Review_1.default({
            sender: req.userId,
            text: text,
            rating: rating,
            restaurantId: id,
        });
        await newReview.save();
        const restaurant = await Restaurant_1.default.findByIdAndUpdate(id, {
            $push: { reviews: newReview._id }
        }, { new: true }).populate({ path: "reviews" });
        if (restaurant) {
            const sum = restaurant?.reviews.reduce((acc, cur) => acc + cur.rating, 0);
            restaurant.rating = parseFloat((sum / (restaurant.reviews.length)).toFixed(1));
            await restaurant.save();
            const reviews = await Review_1.default.find().populate({ path: "sender", select: "username" }).sort({ updatedAt: -1 }).limit(7);
            server_1.activeAdmins.forEach(adminId => {
                server_1.io.to(adminId).emit("updateReviews", reviews);
            });
            for (const [id, socket] of server_1.restaurantsSocketsMap.entries()) {
                if (id === restaurant?.id) {
                    const reviews = await Review_1.default.find({ restaurantId: restaurant._id }).populate({ path: "sender", select: "username" }).sort({ updatedAt: -1 }).limit(7);
                    socket.emit("updateRestaurantReviews", reviews);
                }
            }
            res.status(201).json(newReview);
            return;
        }
        res.status(404).json("Not found!");
        return;
    }
    catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
exports.createReview = createReview;
const getReviews = async (req, res) => {
    const id = req.params.id;
    const page = parseInt(req.query.page);
    try {
        const total = await Review_1.default.countDocuments({ restaurantId: id });
        const reviews = await Review_1.default.find({ restaurantId: id })
            .populate({ path: "sender", select: "username" })
            .skip((page - 1) * 10)
            .limit(10);
        if (reviews) {
            res.status(201).json({ reviews: reviews, length: Math.ceil(total / 10) });
            return;
        }
        else {
            res.status(404).json("Not found!");
            return;
        }
    }
    catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
exports.getReviews = getReviews;
const getFavouriteRestaurants = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.userId).populate({ path: "favourites" });
        if (user?.favourites) {
            res.status(200).json(user.favourites);
            return;
        }
        res.status(400);
        return;
    }
    catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
exports.getFavouriteRestaurants = getFavouriteRestaurants;
