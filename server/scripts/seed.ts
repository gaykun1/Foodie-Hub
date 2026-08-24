/**
 * Seeds the database with a predictable demo dataset.
 *
 *   npm run seed          # wipe the demo collections and re-seed
 *   npm run seed -- --keep-users   # re-seed content, leave real accounts alone
 *
 * Safe to run repeatedly: it removes what it previously created (matched by the
 * seeded titles/usernames) before inserting, so it converges rather than
 * accumulating duplicates.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User";
import Restaurant from "../models/Restaurant";
import Dish from "../models/Dish";
import Review from "../models/Review";
import Cart from "../models/Cart";
import Order from "../models/Order";
import Courier from "../models/Courier";
import Address from "../models/Address";
import Promocode from "../models/Promocode";
import OrderRating from "../models/OrderRating";

import {
    DEMO_ADDRESSES,
    DEMO_CITY,
    DEMO_COUNTRY,
    DEMO_PASSWORD,
    DEMO_PROMOCODES,
    SEED_RESTAURANTS,
} from "./seedData";

dotenv.config();

const keepUsers = process.argv.includes("--keep-users");

const DEMO_USERNAMES = ["demo", "demo-restaurant", "demo-courier", "demo-admin"];

const log = (message: string) => console.log(`[seed] ${message}`);

/**
 * Historic orders so the restaurant and admin dashboards have something to
 * show. Dated across the current and previous week so the week-on-week
 * comparison in getNumbers produces real percentages rather than zeroes.
 */
const daysAgo = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(12, 0, 0, 0);
    return date;
};

const run = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not set — copy .env.example to server/.env first.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    log(`connected to ${mongoose.connection.name}`);

    // ---- clear previously seeded data -------------------------------------
    const seededTitles = SEED_RESTAURANTS.map((r) => r.title);
    const existingRestaurants = await Restaurant.find({ title: { $in: seededTitles } }).select("_id");
    const existingRestaurantIds = existingRestaurants.map((r) => r._id);

    await Dish.deleteMany({ restaurantId: { $in: existingRestaurantIds } });
    await Review.deleteMany({ restaurantId: { $in: existingRestaurantIds } });
    await Restaurant.deleteMany({ _id: { $in: existingRestaurantIds } });
    await Order.deleteMany({ restaurantTitle: { $in: seededTitles } });
    log(`cleared ${existingRestaurantIds.length} previously seeded restaurants`);

    if (!keepUsers) {
        const demoUsers = await User.find({ username: { $in: DEMO_USERNAMES } }).select("_id");
        const demoUserIds = demoUsers.map((u) => u._id);
        await Promise.all([
            Cart.deleteMany({ userId: { $in: demoUserIds } }),
            Order.deleteMany({ userId: { $in: demoUserIds } }),
            Address.deleteMany({ userId: { $in: demoUserIds } }),
            Courier.deleteMany({ userId: { $in: demoUserIds } }),
            OrderRating.deleteMany({ sender: { $in: demoUserIds } }),
        ]);
        await User.deleteMany({ _id: { $in: demoUserIds } });
        await Promocode.deleteMany({ code: { $in: DEMO_PROMOCODES.map((p) => p.code) } });
        log(`cleared ${demoUserIds.length} demo accounts`);
    }

    // ---- restaurants, dishes, reviews --------------------------------------
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    const createdRestaurants = [];
    for (const seed of SEED_RESTAURANTS) {
        const restaurant = await Restaurant.create({
            title: seed.title,
            description: seed.description,
            about: seed.about,
            imageUrl: seed.imageUrl,
            categories: seed.categories,
            address: { city: DEMO_CITY, street: seed.street, houseNumber: seed.houseNumber },
            location: seed.location,
            phone: seed.phone,
            websiteUrl: seed.websiteUrl,
            rating: seed.rating,
            startDay: seed.startDay,
            endDay: seed.endDay,
            startHour: seed.startHour,
            endHour: seed.endHour,
            dishes: [],
            reviews: [],
        });

        const dishes = await Dish.insertMany(
            seed.dishes.map((dish) => ({ ...dish, restaurantId: restaurant._id }))
        );
        restaurant.dishes = dishes.map((d) => d._id);
        await restaurant.save();
        createdRestaurants.push({ doc: restaurant, seed, dishes });
    }
    log(`created ${createdRestaurants.length} restaurants and their menus`);

    if (keepUsers) {
        log("--keep-users: skipping demo accounts, orders and reviews");
        await mongoose.disconnect();
        return;
    }

    // ---- demo accounts ------------------------------------------------------
    const customer = await User.create({
        username: "demo",
        password: hashedPassword,
        email: "demo@foodiehub.example.com",
        phoneNumber: "+380 50 000 0001",
        role: "user",
        address: { street: DEMO_ADDRESSES[0].street, houseNumber: DEMO_ADDRESSES[0].houseNumber, city: DEMO_CITY },
    });

    const ownerRestaurant = createdRestaurants[0].doc;
    const owner = await User.create({
        username: "demo-restaurant",
        password: hashedPassword,
        email: "owner@foodiehub.example.com",
        phoneNumber: "+380 50 000 0002",
        role: "restaurant",
        restaurantId: ownerRestaurant._id,
    });

    const courierUser = await User.create({
        username: "demo-courier",
        password: hashedPassword,
        email: "courier@foodiehub.example.com",
        phoneNumber: "+380 50 000 0003",
        role: "courier",
    });

    const admin = await User.create({
        username: "demo-admin",
        password: hashedPassword,
        email: "admin@foodiehub.example.com",
        phoneNumber: "+380 50 000 0004",
        role: "admin",
    });
    log("created demo accounts: demo, demo-restaurant, demo-courier, demo-admin");

    // An approved courier profile, so the courier dashboard has work to show
    // rather than a pending application.
    const courier = await Courier.create({
        fullname: "Dana Kovalenko",
        phoneNumber: "+380 50 111 2233",
        email: "courier@foodiehub.example.com",
        transport: "Bicycle",
        userId: courierUser._id,
        city: DEMO_CITY,
        age: 27,
        status: "Working",
        rating: 4.8,
        ratingCount: 42,
    });

    // A second, still-pending application so the admin approvals screen is not
    // empty on a fresh seed.
    const applicantUser = await User.create({
        username: "demo-applicant",
        password: hashedPassword,
        email: "applicant@foodiehub.example.com",
        phoneNumber: "+380 50 000 0005",
        role: "user",
    });
    await Courier.create({
        fullname: "Ihor Melnyk",
        phoneNumber: "+380 50 444 5566",
        email: "applicant@foodiehub.example.com",
        transport: "Scooter",
        userId: applicantUser._id,
        city: DEMO_CITY,
        age: 31,
        status: "Processing",
    });

    // Empty carts so the first cart fetch is a hit rather than a lazy create.
    await Cart.insertMany(
        [customer, owner, courierUser, admin].map((u) => ({ userId: u._id, items: [], restaurantId: null }))
    );

    // ---- saved addresses ----------------------------------------------------
    await Address.insertMany(
        DEMO_ADDRESSES.map(({ location, ...address }) => ({ ...address, userId: customer._id }))
    );
    log(`saved ${DEMO_ADDRESSES.length} addresses for the demo customer`);

    // ---- promocodes ---------------------------------------------------------
    const promocodes = await Promocode.insertMany(
        DEMO_PROMOCODES.map((p) => ({ ...p, isUsed: false }))
    );
    const usual = promocodes.find((p) => p.type === "Usual");
    if (usual) {
        customer.usualPromocode = usual._id;
        await customer.save();
    }
    log(`created promocodes: ${DEMO_PROMOCODES.map((p) => p.code).join(", ")}`);

    // ---- reviews ------------------------------------------------------------
    for (const { doc, seed } of createdRestaurants) {
        const reviews = await Review.insertMany(
            seed.reviews.map((review) => ({ ...review, sender: customer._id, restaurantId: doc._id }))
        );
        doc.reviews = reviews.map((r) => r._id);
        await doc.save();
    }
    log("created reviews");

    // ---- order history ------------------------------------------------------
    const home = DEMO_ADDRESSES[0];
    const deliveryAddress = {
        city: home.city,
        countryOrRegion: home.countryOrRegion,
        street: home.street,
        houseNumber: home.houseNumber,
        apartmentNumbr: home.apartmentNumbr,
    };

    const history = [
        { restaurantIndex: 0, status: "Delivered" as const, days: 12, shipping: 3.2, approxTime: 30 },
        { restaurantIndex: 2, status: "Delivered" as const, days: 9, shipping: 2.2, approxTime: 50 },
        { restaurantIndex: 5, status: "Delivered" as const, days: 5, shipping: 5.2, approxTime: 15 },
        { restaurantIndex: 1, status: "Cancelled" as const, days: 4, shipping: 2.2, approxTime: 50 },
        { restaurantIndex: 4, status: "Delivered" as const, days: 2, shipping: 3.2, approxTime: 30 },
        { restaurantIndex: 3, status: "Delivered" as const, days: 1, shipping: 3.2, approxTime: 30 },
    ];

    const createdOrders = [];
    for (const entry of history) {
        const { doc, seed, dishes } = createdRestaurants[entry.restaurantIndex];
        const picked = dishes.slice(0, 2);
        const items = picked.map((dish, index) => ({
            title: dish.title,
            price: dish.price,
            amount: index === 0 ? 1 : 2,
            imageUrl: dish.imageUrl,
        }));
        const subtotal = items.reduce((acc, item) => acc + item.price * item.amount, 0);
        const placedAt = daysAgo(entry.days);

        const order = await Order.create({
            userId: customer._id,
            courierId: entry.status === "Cancelled" ? null : courier._id,
            restaurantTitle: doc.title,
            restaurantImage: doc.imageUrl,
            approxTime: entry.approxTime,
            items,
            totalPrice: +(subtotal + entry.shipping).toFixed(2),
            shippingPrice: entry.shipping,
            discountPercent: 0,
            status: entry.status,
            fullName: "Demo Customer",
            address: deliveryAddress,
            route: { restaurant: seed.location, customer: home.location },
            createdAt: placedAt,
            cancelledAt: entry.status === "Cancelled" ? placedAt : null,
            cancelledBy: entry.status === "Cancelled" ? "restaurant" : null,
            cancelReason: entry.status === "Cancelled" ? "Kitchen closed early" : null,
            refundedAt: entry.status === "Cancelled" ? placedAt : null,
        });
        // createdAt is managed by timestamps, so it has to be forced afterwards
        // for the weekly comparison in getNumbers to see a spread of dates.
        await Order.updateOne({ _id: order._id }, { $set: { createdAt: placedAt, updatedAt: placedAt } });
        createdOrders.push(order);
    }
    log(`created ${createdOrders.length} historic orders`);

    // A couple of ratings so the courier's average is real rather than seeded flat.
    const delivered = createdOrders.filter((o) => o.status === "Delivered").slice(0, 2);
    for (const order of delivered) {
        await OrderRating.create({
            orderId: order._id,
            sender: customer._id,
            restaurantRating: 5,
            courierRating: 5,
            comment: "Arrived early and still hot.",
            courierId: courier._id,
        });
    }

    // A live order waiting for the restaurant to accept, so the owner dashboard
    // has an incoming order the moment they sign in.
    const incomingSource = createdRestaurants[0];
    const incomingItems = incomingSource.dishes.slice(0, 2).map((dish) => ({
        title: dish.title,
        price: dish.price,
        amount: 1,
        imageUrl: dish.imageUrl,
    }));
    await Order.create({
        userId: customer._id,
        courierId: null,
        restaurantTitle: incomingSource.doc.title,
        restaurantImage: incomingSource.doc.imageUrl,
        approxTime: 30,
        items: incomingItems,
        totalPrice: +(incomingItems.reduce((acc, i) => acc + i.price * i.amount, 0) + 3.2).toFixed(2),
        shippingPrice: 3.2,
        discountPercent: 0,
        status: "Created",
        fullName: "Demo Customer",
        address: deliveryAddress,
        route: { restaurant: incomingSource.seed.location, customer: home.location },
    });
    log("created one live incoming order for the restaurant dashboard");

    await mongoose.disconnect();
    log("done");
    log(`sign in with any of: ${DEMO_USERNAMES.join(", ")} / ${DEMO_PASSWORD}`);
};

run().catch(async (err) => {
    console.error("[seed] failed:", err);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});
