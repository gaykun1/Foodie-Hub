import request from "supertest"
import jwt from 'jsonwebtoken';
import { app } from "../../app";

import User, { IUserDocument } from "../../models/User";
import Order from "../../models/Order";
import Cart, { ICartDocument } from "../../models/Cart";
import Restaurant, { IRestaurantDocument } from "../../models/Restaurant";
import Dish, { IDishDocument } from "../../models/Dish";
import mongoose from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});
describe("cart api", () => {
    let validToken: string;
    let user: IUserDocument;
    beforeAll(async () => {
        user = await User.create({ username: "testuser2", password: "12345678Aa" });
        validToken = await jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    })
    afterAll(async () => {
        await User.deleteOne({});
        await Cart.deleteMany({});

    })

    describe("get cart", () => {

        it("200 create cart", async () => {
            const res = await request(app).get("/api/cart")
                .set("Cookie", `token=${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("userId", user._id.toString());
            expect(res.body.items).toEqual([]);

        });
        it("200 get cart", async () => {
            const cart = await Cart.create({
                userId: user._id,
                items: [],
                restaurantId: null,
            })
            const res = await request(app).get("/api/cart")
                .set("Cookie", `token=${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("userId", user._id.toString());

        })
        it("500 server error cart findOne", async () => {
            jest.spyOn(Cart, "findOne").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).get(`/api/cart`)
                .set("Cookie", `token=${validToken}`);

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        })
    })

    describe("update cart", () => {
        let cart: ICartDocument;
        let dish: IDishDocument;
        let restaurant: IRestaurantDocument;
        let dishId: string;
        beforeAll(async () => {
            restaurant = await Restaurant.create({
                title: "Best Burger Place",
                description: "Cool restaurant",
                imageUrl: "someImage",
                categories: ["Fast Food"],
                address: {
                    street: "Street",
                    city: "city",
                    houseNumber: 4,
                },
                startDay: "Monday",
                endDay: "Monday",
                endHour: "6:00",
                startHour: "6:00",
                websiteUrl: "dsadasdas",
                phone: "+312421412"

            });
            dish = await Dish.create({
                title: "Burger",
                description: "Tasty burger",
                imageUrl: "image.jpg",
                price: 32,
                restaurantId: restaurant._id,
                typeOfFood: "Desserts"
            });
            dishId = dish._id.toString();
            cart = await Cart.create({
                userId: user._id,
                restaurantId: restaurant._id,
                items: [
                    {
                        dishId: dish._id,
                        amount: 2,
                        title: dish.title
                    }
                ]
            });



        })

        afterEach(async () => {
            await Restaurant.deleteOne({});
            await Dish.deleteOne({});
        })

        it("amount==0 200", async () => {
            const res = await request(app).patch(`/api/cart/items/${dishId}`)
                .send({ amount: 0, title: "burger" })
                .set("Cookie", `token=${validToken}`);
            expect(res.body).toEqual({});
            expect(res.status).toBe(200);

        })
        it("amount>0 200", async () => {
            const res = await request(app).patch(`/api/cart/items/${dishId}`)
                .send({ amount: 3, title: "burger" })
                .set("Cookie", `token=${validToken}`);
            expect(res.body).toEqual({});
            expect(res.status).toBe(200);

        });

        it("500 server error order findOne", async () => {
            jest.spyOn(Order, "findOne").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).patch(`/api/cart/items/${dishId}`)
                .set("Cookie", `token=${validToken}`).send({ amount: 3, title: "burger" });

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        })
        it("500 server error cart findOneAndUpdate", async () => {
            jest.spyOn(Cart, "findOneAndUpdate").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).patch(`/api/cart/items/${dishId}`)
                .set("Cookie", `token=${validToken}`).send({ amount: 3, title: "burger" });

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        })

    })

    describe("add to cart ", () => {
        let cart: ICartDocument;
        let dish: IDishDocument;
        let restaurant: IRestaurantDocument;
        let dishId: string;
        let restaurantId: string;
        beforeEach(async () => {
            await Cart.deleteMany({});
            cart = await Cart.create({
                userId: user._id,
                restaurantId: restaurant._id,
                items: []
            });
        });
        beforeAll(async () => {
            restaurant = await Restaurant.create({
                title: "Best Burger Place",
                description: "Cool restaurant",
                imageUrl: "someImage",
                categories: ["Fast Food"],
                address: {
                    street: "Street",
                    city: "city",
                    houseNumber: 4,
                },
                startDay: "Monday",
                endDay: "Monday",
                endHour: "6:00",
                startHour: "6:00",
                websiteUrl: "dsadasdas",
                phone: "+312421412"

            });
            dish = await Dish.create({
                title: "Burger",
                description: "Tasty burger",
                imageUrl: "image.jpg",
                price: 32,
                restaurantId: restaurant._id,
                typeOfFood: "Desserts",
            });

            dishId = dish._id.toString();
            restaurantId = restaurant._id.toString();
        })

        afterAll(async () => {
            await Restaurant.deleteMany({});
            await Dish.deleteMany({});
        })
        it("404 dish is  not found", async () => {

            const res = await request(app).post("/api/cart/items").set("Cookie", `token=${validToken}`).send({ id: new mongoose.Types.ObjectId });

            expect(res.status).toBe(404);
            expect(res.body).toBe("Dish is not found");

        })
        it("400 dish is  not from cart restaurant", async () => {
            const newDish = await Dish.create({
                title: "Burger",
                description: "Tasty burger",
                imageUrl: "image.jpg",
                price: 32,
                restaurantId: new mongoose.Types.ObjectId,
                typeOfFood: "Desserts"
            });
            const res = await request(app).post("/api/cart/items").set("Cookie", `token=${validToken}`).send({ id: newDish._id });

            expect(res.status).toBe(400);
            expect(res.body).toBe("Not allowed other restaurants!");

        })
        it("201 added item to cart", async () => {
            const newDish: IDishDocument = await Dish.create({
                title: "Burger",
                description: "Tasty burger",
                imageUrl: "image.jpg",
                price: 32,
                restaurantId: restaurant._id,
                typeOfFood: "Desserts"
            });
            const res = await request(app).post("/api/cart/items").set("Cookie", `token=${validToken}`).send({ id: newDish._id });

            await Cart.deleteMany({});

            expect(res.status).toBe(201);
            expect(res.body.items.length).toBe(1);
            expect(res.body.items[0].amount).toBe(1);
            expect(res.body.restaurantId._id).toBe(restaurant._id.toString());

        })
        it("201 creates the cart on the fly if the user doesn't have one yet", async () => {
            await Cart.deleteMany({});

            const res = await request(app).post("/api/cart/items")
                .set("Cookie", `token=${validToken}`).send({ id: dish._id });

            expect(res.status).toBe(201);
            expect(res.body.items.length).toBe(1);
        })
        it("500 cart findOne", async () => {
            jest.spyOn(Cart, "findOne").mockImplementationOnce(() => {
                throw new Error("DB error");
            })
            const res = (await request(app).post("/api/cart/items")
                .set("Cookie", `token=${validToken}`).send({ id: dish._id }));

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");

        })
    })
})