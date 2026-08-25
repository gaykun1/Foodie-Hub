import { Request, Response } from "express";
import Restaurant, { Category } from "../models/Restaurant";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import Dish, { IDish } from "../models/Dish";
import Review, { IReview } from "../models/Review";
import { activeAdmins, io, restaurantsSocketsMap } from "../socket";
import { escapeRegExp } from "../utils/regex";
import { geocodeStructured } from "../utils/geocode";



export const getRestaurantsFiltered = async (req: Request, res: Response): Promise<void> => {
    const categorie = req.query.categorie;
    try {
        if (categorie === Category.All) {
            const restaurants = await Restaurant.find({});
            res.status(200).json(restaurants);
            return;
        }
        const restaurants = await Restaurant.find({ categories: categorie });
        if (restaurants.length === 0) {
            res.status(404).json({ message: "Not Found!" });
            return;
        }
        res.status(200).json(restaurants);
        return;
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// True if the acting user may manage the given restaurant: an admin, or the
// restaurant account that owns it. Restaurant-management routes are shared
// between the admin's per-restaurant dashboard and the owner's own dashboard
// (see client AddDishPanel), so both need to pass this, not just "is logged in".
const canManageRestaurant = async (userId: string, restaurantId: string): Promise<boolean> => {
    const actingUser = await User.findById(userId);
    if (!actingUser) return false;
    if (actingUser.role === "admin") return true;
    return actingUser.role === "restaurant" && actingUser.restaurantId?.toString() === restaurantId;
};

export const createItem = async (req: Request, res: Response) => {
    const restaurantData = req.body;
    try {
        // Resolved once, here, so live tracking can read a stored point instead
        // of geocoding this restaurant's street address on every map open.
        // A null result is fine — tracking falls back to on-demand lookup.
        const location = await geocodeStructured({
            street: restaurantData.street,
            houseNumber: restaurantData.houseNumber,
            city: restaurantData.city,
        });

        const newRestaurant = await Restaurant.create({
            title: restaurantData.title,
            description: restaurantData.description,
            address: {
                city: restaurantData.city,
                street: restaurantData.street,
                houseNumber: restaurantData.houseNumber,
            },
            location,
            phone: restaurantData.phone,
            websiteUrl: restaurantData.websiteUrl,
            imageUrl: restaurantData.imageUrl,
            categories: restaurantData.categories,
            startDay: restaurantData.startDay,
            endDay: restaurantData.endDay,
            startHour: restaurantData.startHour,
            endHour: restaurantData.endHour,
        });
        // Link the creator to their new restaurant — nothing else in the app ever
        // sets User.restaurantId, which left every owner-scoped dashboard route dead.
        await User.findByIdAndUpdate((req as AuthRequest).userId, {
            role: "restaurant",
            restaurantId: newRestaurant._id,
        });
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
    const { info } = req.body;
    const id = req.params.id;
    try {
        if (!(await canManageRestaurant((req as AuthRequest).userId, id))) {
            res.status(403).json("Access denied");
            return;
        }

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
            // 200, not 201: this is a read. The Created status was misleading
            // for anything inspecting the API from the outside.
            res.status(200).json(restaurant?.about);
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

// func for getting last seven reviews
export const getLastSevenReviews = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        if (id == null) {


            const reviews = await Review.find().populate({ path: "sender", select: "username" }).sort({ updatedAt: -1 }).limit(7);
            if (!reviews) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(reviews);
            return
        } else {
            const reviews = await Review.find({ restaurantId: id }).populate({ path: "sender", select: "username" }).sort({ updatedAt: -1 }).limit(7);
            if (!reviews) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(reviews);
            return
        }

    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}
export const getTopSevenDishes = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        // if id is not null than its for restaurant otherwise admin
        if (id == null) {
            const topDishes = await Dish.find().sort({ sold: -1 }).limit(7);
            if (!topDishes) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(topDishes);
            return
        } else {
            // sorting top by most sold items
            const topDishes = await Dish.find({ restaurantId: id }).sort({ sold: -1 }).limit(7);
            if (!topDishes) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(topDishes);
            return
        }
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}
export const getDishesNearYou = async (req: Request, res: Response): Promise<void> => {
    const city = req.query.city;

    try {
        // Without a city this used to match nothing and return an empty list, so
        // logged-out visitors (who have no saved address) saw a permanently blank
        // section on the home page. Falling back to the platform-wide best
        // sellers gives every visitor something real to browse.
        const filter = city ? { "address.city": city } : {};
        const restaurants = await Restaurant.find(filter).populate<{ dishes: IDish[] }>("dishes");

        // Each dish carries its restaurant's identity so the client can add it to
        // a cart directly from this list — the dish document alone does not say
        // which restaurant's basket it belongs in.
        const dishes = restaurants.flatMap((restaurant) =>
            restaurant.dishes.map((dish) => {
                const plain = (dish as IDish & { toObject: () => IDish }).toObject();
                return {
                    ...plain,
                    restaurant: {
                        _id: restaurant._id,
                        title: restaurant.title,
                        imageUrl: restaurant.imageUrl,
                    },
                };
            })
        );

        const topDishes = dishes.sort((a, b) => b.sold - a.sold).slice(0, 8);

        res.status(200).json(topDishes);
    } catch (err) {
        console.error("[getDishesNearYou] error:", err);
        res.status(500).json("Server error!");
    }
}



export const createDish = async (req: Request, res: Response) => {
    const { dish, id } = req.body;
    try {
        if (!(await canManageRestaurant((req as AuthRequest).userId, id))) {
            res.status(403).json("Access denied");
            return;
        }
        if (typeof dish?.price !== "number" || !Number.isFinite(dish.price) || dish.price < 0) {
            res.status(400).json("Price must be a non-negative number");
            return;
        }

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
            if (!restaurant) {
                res.status(404).json("Not found!");
                return;
            }

            restaurant.dishes.push(newDish._id);

            await restaurant.save();

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
        const restaurant = await Restaurant.findOne({ _id: id });
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
        // `location` rides along so the tracking map can use the stored point
        // for orders placed before coordinates were persisted on the order.
        // `adress` (the pre-rename spelling) is selected too, purely so the
        // legacy-address fallback below has something to fall back to for a
        // document a deployment's migration hasn't reached yet — a `.select()`
        // projection fetches only what it names, so without this the fallback
        // would have nothing to work with and still return no address.
        const restaurant = await Restaurant.findOne({ title: title }).select("address adress location");
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
export const toggleFavourite = async (req: Request, res: Response): Promise<void> => {
    const restaurantId = req.params.id;
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
        res.status(500).json({
            error: "Server error",
        });
        return;
    }
}

export const searchRestaurants = async (req: Request, res: Response): Promise<void> => {

    const { chars } = req.query;
    try {
        // Unauthenticated endpoint taking raw regex from the query string was a
        // ReDoS vector (e.g. "(a+)+$") — escape it so it's matched literally.
        // Explicitly sorted: with no sort clause Mongo returns whatever order the
        // chosen plan produces, so results silently reshuffled when an index was
        // added. Search results need to be stable for the same query.
        const restaurants = await Restaurant.find({ title: { $regex: escapeRegExp(String(chars ?? "")), $options: 'i' } })
            .sort({ title: 1 })
            .limit(5);
        res.status(200).json(restaurants);
        return;
    } catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
}


export const getDishes = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        // title/imageUrl ride along with the menu: the client needs the
        // restaurant's identity to put a dish in a cart, and a guest basket has
        // no server-side document to look it up from.
        const dishes = await Restaurant.findById(id).populate({ path: "dishes" }).select("dishes title imageUrl");
        res.status(200).json(dishes);
        return;
    } catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
}

export const deleteDish = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const existingDish = await Dish.findById(id);
        if (!existingDish) {
            res.status(404).json({ message: "Dish not found" });
            return;
        }
        if (!(await canManageRestaurant((req as AuthRequest).userId, existingDish.restaurantId.toString()))) {
            res.status(403).json("Access denied");
            return;
        }

        const dish = await Dish.findByIdAndDelete(id);
        if (!dish) {
            res.status(404).json({ message: "Dish not found" });
            return;
        }
        const restaurant = await Restaurant.findById(dish?.restaurantId);
        if (!restaurant) {
            res.status(404).json({ message: "Dish not found" });
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

// creating review and recalculating rating of Restaurant
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
        ).populate<{ reviews: IReview[] }>({ path: "reviews" });
        if (restaurant) {
            const sum = restaurant?.reviews.reduce((acc, cur) => acc + cur.rating, 0);
            restaurant.rating = parseFloat((sum / (restaurant.reviews.length)).toFixed(1));
            await restaurant.save();
            const reviews = await Review.find().populate({ path: "sender", select: "username" }).sort({ updatedAt: -1 }).limit(7);
            activeAdmins.forEach(adminId => {
                io.to(adminId).emit("updateReviews", reviews);
            });
            for (const [id, socket] of restaurantsSocketsMap.entries()) {
                if (id === restaurant?.id) {
                    const reviews = await Review.find({ restaurantId: restaurant._id }).populate({ path: "sender", select: "username" }).sort({ updatedAt: -1 }).limit(7);
                    socket.emit("updateRestaurantReviews", reviews);
                }
            }
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
    const page = parseInt(req.query.page as string);
    try {
        const total = await Review.countDocuments({ restaurantId: id });
        const reviews = await Review.find({ restaurantId: id })
            .populate({ path: "sender", select: "username" })
            .skip((page - 1) * 10)
            .limit(10);
        if (reviews) {
            // 200, not 201: reading a page of reviews creates nothing.
            res.status(200).json({ reviews: reviews, length: Math.ceil(total / 10) });
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