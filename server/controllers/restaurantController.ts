import { Request, Response } from "express";
import Restaurant, { Category } from "../models/Restaurant";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import Dish from "../models/Dish";
import Review, { ReviewType } from "../models/Review";
import { activeAdmins, io } from "../server";



export const getRestaurantsFiltered = async (req: Request, res: Response): Promise<void> => {
    const { categorie } = req.body;

    try {
        if (categorie === Category.All) {
            const restaurants = await Restaurant.find({});
            res.status(200).json(restaurants);
            return;
        }
        const restaurants = await Restaurant.find({ categories: categorie });
        if (!restaurants) {
            res.status(404).json({ message: "Not Found!" });
            return;
        }
        res.status(200).json(restaurants);
        return;
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const createItem = async (req: Request, res: Response) => {
    const restaurantData = req.body;
    try {


        const newRestaurant = new Restaurant({
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

    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
export const handleAbout = async (req: Request, res: Response) => {
    const { id, info } = req.body;
    try {

        const restaurant = await Restaurant.findById(id);
        if (restaurant) {
            restaurant.about = info;
            await restaurant.save()

        }


        res.status(201).json(restaurant?.about);
        return;

    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};

export const getAbout = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {

        const restaurant = await Restaurant.findById(id);
        if (restaurant) {
            res.status(201).json(restaurant?.about);
            return

        }

        res.status(404).json("Not Found!");
        return


    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};

export const getLastSevenReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const reviews = await Review.find().populate({ path: "sender", select: "username" }).sort({ updatedAt: -1 }).limit(7);
        if (!reviews) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(reviews);
        return
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}
export const getTopSevenDishes = async (req: Request, res: Response): Promise<void> => {
    try {
        const topDishes = await Dish.find().sort({ sold: -1 }).limit(7);
        if (!topDishes) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(topDishes);
        return
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}



export const createDish = async (req: Request, res: Response) => {
    const { dish, id } = req.body;
    try {



        const newDish = new Dish({
            title: dish.title,
            description: dish.description,
            imageUrl: dish.imageUrl,
            price: dish.price,
            restaurantId: id,
            typeOfFood: dish.typeOfFood,

        });
        await newDish.save();
        if (newDish) {
            const restaurant = await Restaurant.findById(id);
            if (restaurant) {
                restaurant.dishes.push(newDish._id);

                await restaurant.save();
            }
            res.status(201).json(newDish);
            return;
        }
        res.status(404).json("Not found!");
        return;

    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};
export const getRestaurantById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const restaurant = await Restaurant.findOne({ _id: id }).select("-_id");
        if (!restaurant) {
            res.status(404).json({
                message: "Not found!",
            });
            return;
        }
        res.status(200).json(restaurant);
        return;
    } catch {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
}


export const getRestaurantAddress = async (req: Request, res: Response): Promise<void> => {
    const title = req.params.title;
    try {
        const restaurant = await Restaurant.findOne({ title: title }).select("adress");
        if (!restaurant) {
            res.status(404).json({
                message: "Not found!",
            });
            return;
        }
        res.status(200).json(restaurant);
        return;
    } catch {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
}
export const toggleToFavourite = async (req: Request, res: Response): Promise<void> => {
    const { restaurantId } = req.body;
    try {
        const user = await User.findById((req as AuthRequest).userId);
        if (user) {

            const index = user.favourites.indexOf(restaurantId);

            if (index > -1) {

                user.favourites.splice(index, 1);
            } else {
                user.favourites.push(restaurantId);
            }
            await user.save();
            res.status(200).json(user.favourites);
            return;
        }
        res.status(404).json("Not found!");
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
}

export const searchRestaurants = async (req: Request, res: Response): Promise<void> => {

    const { chars } = req.body;
    try {

        const restaurants = await Restaurant.find({ title: { $regex: chars, $options: 'i' } }).limit(5);
        res.json(restaurants);
        return;
    } catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
}


export const getDishes = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const dishes = await Restaurant.findById(id).populate({ path: "dishes" }).select("dishes");
        res.json(dishes);
        return;
    } catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
}

export const deleteDish = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const dish = await Dish.findByIdAndDelete(id);
        if (!dish) {
            res.status(404).json({ error: "Dish not found" });
            return;
        }
        const restaurant = await Restaurant.findById(dish?.restaurantId);
        if (!restaurant) {
            res.status(404).json({ error: "Dish not found" });
            return;
        }
        restaurant.dishes = restaurant.dishes.filter(d => !d.equals(dish._id));
        await restaurant.save();
        res.status(200).json("Deleted!");
        return;


    } catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
}

// route for creating review and recalculating rating of Restaurant

export const createReview = async (req: Request, res: Response) => {
    const { id, text, rating } = req.body;
    try {
        const newReview = new Review({
            sender: (req as AuthRequest).userId,
            text: text,
            rating: rating,
            restaurantId: id,
        });
        await newReview.save();
        const restaurant = await Restaurant.findByIdAndUpdate(id, {
            $push: { reviews: newReview._id }
        }, { new: true }
        ).populate<{ reviews: ReviewType[] }>({ path: "reviews" });
        if (restaurant) {
            const sum = restaurant?.reviews.reduce((acc, cur) => acc + cur.rating, 0);
            restaurant.rating = parseFloat((sum / (restaurant.reviews.length)).toFixed(1));
            await restaurant.save();
            const reviews = await Review.find().populate({ path: "sender", select: "username" }).sort({ updatedAt: -1 }).limit(7);
            activeAdmins.forEach(adminId => {
                io.to(adminId).emit("updateReviews", reviews);
            });
            res.status(201).json(newReview);
            return;
        }
        res.status(404).json("Not found!");
        return;


    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};


export const getReviews = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {


        const reviews = await Restaurant.findById(id).select("reviews").populate({
            path: "reviews",
            populate: {
                path: "sender",
                select: "username"
            },
        });

        if (reviews) {
            res.status(201).json(reviews.reviews);
            return;
        }
        else {
            res.status(404).json("Not found!");
            return;
        }


    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
};


export const getFavouriteRestaurants = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById((req as AuthRequest).userId).populate({ path: "favourites" });
        if (user?.favourites) {
            res.status(200).json(user.favourites);
            return;
        }
        res.status(400);
        return;
    } catch (err) {
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
}