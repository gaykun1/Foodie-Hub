import request from 'supertest'
import jwt from "jsonwebtoken"
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User, { IUserDocument } from '../../models/User';
import Cart, { ICartDocument } from '../../models/Cart';
import { app } from '../../app';
import Order, { IOrder, IOrderDocument } from '../../models/Order';
import Restaurant, { Category, IRestaurantDocument } from '../../models/Restaurant';
import Dish, { IDishDocument } from '../../models/Dish';
import Courier, { ICourierDocument } from '../../models/Courier';
import { stripe } from '../../utils/stripeClient';
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

describe("order api", () => {
    let user: IUserDocument;
    let restaurantUser: IUserDocument;
    let cart: ICartDocument;
    let order: IOrderDocument;
    let userToken: string;
    let restaurantUserToken: string;
    let restaurant1: IRestaurantDocument;
    let dish: IDishDocument;
    beforeAll(async () => {
        user = await User.create({ username: "testuser4", password: "12345678Aa" });
        restaurantUser = await User.create({ username: "restaurantUser", password: "12345678Aa", role: "restaurant" });
        userToken = await jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: '1h' });
        restaurantUserToken = await jwt.sign({ userId: restaurantUser._id, role: "restaurant" }, process.env.JWT_SECRET!, { expiresIn: '1h' });
        restaurant1 = await Restaurant.create({
            title: "Best Burger",
            dishes: [],
            description: "Cool restaurant",
            imageUrl: "someImage",
            categories: [Category.Desserts],
            adress: {
                street: "Street",
                city: "city",
                houseNumber: 4,
            },
            startDay: "Monday",
            endDay: "Monday",
            endHour: "6:00",
            startHour: "6:00",
            websiteUrl: "dsadasdas",
            phone: "+312421412",

        })
        dish = await Dish.create({
            title: "newBurger",
            description: "Tasty burger",
            imageUrl: "image.jpg",
            price: 32,
            restaurantId: restaurant1._id,
            typeOfFood: "Desserts"
        });
        restaurant1.dishes.push(dish._id);
        await restaurant1.save();
        cart = await Cart.create({
            userId: user._id,
            items: [{ dishId: dish._id, amount: 3 }],
            restaurantId: restaurant1._id,
        })
    })
    beforeEach(async () => {
        order = await Order.create({
            userId: user._id,
            items: [{
                title: dish.title,
                imageUrl: dish.imageUrl,
                price: dish.price,
                amount: 3,
            }],
            adress: {
                city: "city",
                countryOrRegion: "region",
                houseNumber: 3,
                apartmentNumbr: null,
                street: "street",

            },
            shippingPrice: 2.2,
            totalPrice: 96,
            approxTime: 15,
            restaurantTitle: "Best Burger",
            restaurantImage: "someImage",
            status: "Preparing",
            courierId: null,
        });

    });

    afterEach(async () => {

        await Order.deleteMany({});

    })
    afterAll(async () => {
        await User.deleteMany({});
        await Cart.deleteMany({});
        await Restaurant.deleteMany({});
    })
    describe("create order", () => {
        let cart: any;
        let newOrder: IOrderDocument;
        beforeEach(async () => {


            cart = {
                userId: user._id,
                items: [{ dishId: dish, amount: 3 }],
                restaurantId: {
                    title: restaurant1.title,
                    imageUrl: restaurant1.imageUrl,
                    _id: restaurant1._id
                },
            }
            newOrder = await Order.create({
                userId: user._id,
                items: [{
                    title: dish.title,
                    imageUrl: dish.imageUrl,
                    price: dish.price,
                    amount: 3,
                }],
                adress: {
                    city: "city",
                    countryOrRegion: "region",
                    houseNumber: 3,
                    apartmentNumbr: null,
                    street: "street",

                },
                shippingPrice: 2.2,
                totalPrice: 96,
                approxTime: 15,
                restaurantTitle: "Best Burger",
                restaurantImage: "someImage",
                status: null,
                courierId: null,
            });
        })
        // afterEach(async()=>{

        // })
        it("200 if was created before", async () => {

            const res = await request(app).post("/api/order/orders")
                .set("Cookie", `token=${userToken}`).send({ cart });
            expect(res.status).toBe(200);
            expect(res.body).toBe(newOrder._id.toString());
        })
        it("201 created", async () => {
            await Order.deleteMany({});
            const res = await request(app).post("/api/order/orders")
                .set("Cookie", `token=${userToken}`).send({ cart });
            expect(res.status).toBe(201);
            expect(res.body).toBeDefined();
        })


        it("500 server error order findOne", async () => {
            jest.spyOn(Order, "findOne").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).post(`/api/order/orders`)
                .set("Cookie", `token=${userToken}`).send({ cart });

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        })
        it("500 server error order create", async () => {
            await Order.deleteMany({});
            jest.spyOn(Order, "create").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).post(`/api/order/orders`)
                .set("Cookie", `token=${userToken}`).send({ cart });

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        })
    })
    describe("get orders", () => {

        it("200 getting", async () => {
            const res = await request(app).get("/api/order/orders")
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body[0]._id).toBe(order._id.toString());
        })
        it("404 not found", async () => {
            await Order.deleteMany({});
            const res = await request(app).get("/api/order/orders")
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toBe("Not found!");
        })

        it("excludes in-progress checkout drafts (status: null) — they have no address yet and aren't a real order", async () => {
            await Order.deleteMany({});
            await Order.create({
                userId: user._id,
                items: [{ title: dish.title, imageUrl: dish.imageUrl, price: dish.price, amount: 1 }],
                restaurantTitle: restaurant1.title,
                restaurantImage: restaurant1.imageUrl,
                approxTime: 0,
                totalPrice: dish.price,
                status: null,
            });

            const res = await request(app).get("/api/order/orders")
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(404);
        })

        it("500 server error order find", async () => {
            jest.spyOn(Order, "find").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).get(`/api/order/orders`)
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        })

    })
    describe("update order (checkout)", () => {
        const validFormData = { city: "Kyiv", countryOrRegion: "Ukraine", houseNumber: "3", street: "Shevchenko", name: "A", surname: "B" };

        beforeEach(async () => {
            await Order.create({
                userId: user._id,
                items: [{ title: dish.title, imageUrl: dish.imageUrl, price: dish.price, amount: 3 }],
                restaurantTitle: restaurant1.title,
                restaurantImage: restaurant1.imageUrl,
                approxTime: 0,
                totalPrice: 96,
                status: null,
                courierId: null,
            });
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("recomputes totalPrice/discount from the order's own items, ignoring a tampered client total and discount", async () => {
            // subtotal (32 * 3 = 96) + shipping 2.2 = 98.2 -> 9820 cents; the mocked
            // PaymentIntent must match that exactly, mirroring what Stripe would
            // actually report for a real successful charge of this order.
            jest.spyOn(stripe.paymentIntents, "retrieve").mockResolvedValueOnce({ status: "succeeded", amount: 9820 } as any);

            const res = await request(app).patch("/api/order/orders")
                .set("Cookie", `token=${userToken}`)
                .send({ formData: validFormData, shipping: 2.2, cartId: cart._id, percent: 90, totalPrice: 0.01, paymentIntentId: "pi_test_ok" });

            expect(res.status).toBe(200);
            const saved = await Order.findOne({ userId: user._id, status: "Created" });
            // subtotal (32 * 3 = 96) + shipping 2.2, discount clamped to 0 since this user holds no promocode
            expect(saved?.totalPrice).toBeCloseTo(98.2, 2);
            expect(saved?.discountPercent).toBe(0);
        });

        it("won't finalize the order without a paymentIntentId at all", async () => {
            const res = await request(app).patch("/api/order/orders")
                .set("Cookie", `token=${userToken}`)
                .send({ formData: validFormData, shipping: 2.2, cartId: cart._id, percent: 0 });

            expect(res.status).toBe(402);
            const saved = await Order.findOne({ userId: user._id, status: "Created" });
            expect(saved).toBeNull();
        });

        it("won't finalize the order if the PaymentIntent hasn't actually succeeded (declined card, abandoned 3DS, etc.)", async () => {
            jest.spyOn(stripe.paymentIntents, "retrieve").mockResolvedValueOnce({ status: "requires_payment_method", amount: 9820 } as any);

            const res = await request(app).patch("/api/order/orders")
                .set("Cookie", `token=${userToken}`)
                .send({ formData: validFormData, shipping: 2.2, cartId: cart._id, percent: 0, paymentIntentId: "pi_test_declined" });

            expect(res.status).toBe(402);
            const saved = await Order.findOne({ userId: user._id, status: "Created" });
            expect(saved).toBeNull();
        });

        it("won't finalize the order if the PaymentIntent's paid amount doesn't match this order's real total (stale/mismatched intent)", async () => {
            jest.spyOn(stripe.paymentIntents, "retrieve").mockResolvedValueOnce({ status: "succeeded", amount: 1 } as any);

            const res = await request(app).patch("/api/order/orders")
                .set("Cookie", `token=${userToken}`)
                .send({ formData: validFormData, shipping: 2.2, cartId: cart._id, percent: 0, paymentIntentId: "pi_test_mismatch" });

            expect(res.status).toBe(402);
            const saved = await Order.findOne({ userId: user._id, status: "Created" });
            expect(saved).toBeNull();
        });

        it("rejects a shipping price outside the whitelisted options", async () => {
            const res = await request(app).patch("/api/order/orders")
                .set("Cookie", `token=${userToken}`)
                .send({ formData: validFormData, shipping: 0.01, cartId: cart._id, percent: 0 });

            expect(res.status).not.toBe(200);
            const saved = await Order.findOne({ userId: user._id, status: "Created" });
            expect(saved).toBeNull();
        });
    })
    describe("get order by id", () => {

        it("200 getting", async () => {
            const res = await request(app).get(`/api/order/orders/${order._id}`)
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body._id).toBe(order._id.toString());
        })
        it("404 not found", async () => {
            await Order.deleteMany({});
            const res = await request(app).get(`/api/order/orders/${order._id}`)
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toBe("Not found!");
        })


        it("500 server error order findOne", async () => {
            jest.spyOn(Order, "findOne").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).get(`/api/order/orders/${order._id}`)
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        })

    })
    describe("toggle to preparing(cooking)", () => {

        it("200 toggled", async () => {
            const res = await request(app).patch(`/api/order/orders/${order._id}/status`)
                .set("Cookie", `token=${restaurantUserToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toBe("Toggled status to Preparing");
        })


        it("500 server error order findOne", async () => {
            jest.spyOn(Order, "findByIdAndUpdate").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).patch(`/api/order/orders/${order._id}/status`)
                .set("Cookie", `token=${restaurantUserToken}`);

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        })

    })
    describe("get just created orders", () => {
        let createdOrder: IOrderDocument;
        beforeEach(async () => {
            createdOrder = await Order.create({
                userId: user._id,
                items: [{
                    title: dish.title,
                    imageUrl: dish.imageUrl,
                    price: dish.price,
                    amount: 3,
                }],
                shippingPrice: 2.2,
                totalPrice: 96,
                approxTime: 15,
                restaurantTitle: "Best Burger",
                restaurantImage: "someImage",
                status: "Created",
            });
        })

        it("200 getting", async () => {
            const res = await request(app).get(`/api/order/orders/${restaurant1._id}/created`)
                .set("Cookie", `token=${restaurantUserToken}`);
            expect(res.status).toBe(200);
            expect(res.body[0]._id).toBe(createdOrder._id.toString());
        })


        it("500 server error order findOne", async () => {
            jest.spyOn(Order, "find").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).get(`/api/order/orders/${order._id}/created`)
                .set("Cookie", `token=${restaurantUserToken}`);

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        })

        it("500 server error order findOne", async () => {
            jest.spyOn(Restaurant, "findById").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).get(`/api/order/orders/${order._id}/created`)
                .set("Cookie", `token=${restaurantUserToken}`);

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        })

    })

    describe("get free-orders for courier", () => {

        let courierUser: IUserDocument;
        let courierToken: string;

        beforeAll(async () => {
            courierUser = await User.create({ username: "courierUser", password: "12345678Aa", role: "courier" });
            courierToken = await jwt.sign({ userId: courierUser._id, role: "courier" }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        })
        afterAll(async () => {
            await User.deleteMany({});
        })


        it("200 getting", async () => {
            const res = await request(app).get(`/api/order/free-orders/city`)
                .set("Cookie", `token=${courierToken}`);
            expect(res.status).toBe(200);
            expect(res.body[0]._id).toBe(order._id.toString());
        })
        it("404 not found", async () => {
            await Order.deleteMany({});
            const res = await request(app).get(`/api/order/free-orders/city`)
                .set("Cookie", `token=${courierToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toBe("Not found!");
        })


        it("500 server error order find", async () => {
            jest.spyOn(Order, "find").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).get(`/api/order/free-orders/city`)
                .set("Cookie", `token=${courierToken}`);

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        })

    })
    describe("get courier orders", () => {

        let courierUser: IUserDocument;
        let courierToken: string;
        let courier: ICourierDocument;
        let newOrder:IOrderDocument
        beforeAll(async () => {
            courierUser = await User.create({ username: "courierUser", password: "12345678Aa", role: "courier" });
            courier = await Courier.create({
                phoneNumber: "+213123123",
                transport: "Car",
                fullname: "John Newman",
                city: "city",
                age: 21,
                email: "email@gmail.com",
                userId: courierUser._id,
                status: "Working",
            });
            newOrder = await Order.create({
                userId: user._id,
                items: [{
                    title: dish.title,
                    imageUrl: dish.imageUrl,
                    price: dish.price,
                    amount: 3,
                }],
                adress: {
                    city: "city",
                    countryOrRegion: "region",
                    houseNumber: 3,
                    apartmentNumbr: null,
                    street: "street",

                },
                shippingPrice: 2.2,
                totalPrice: 96,
                approxTime: 15,
                restaurantTitle: "Best Burger",
                restaurantImage: "someImage",
                status: "Preparing",
                courierId: courier._id,
            });
            courierToken = await jwt.sign({ userId: courierUser._id, role: "courier" }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        })
        afterAll(async () => {
            await User.deleteMany({});
        })

        it("200 getting", async () => {
            const res = await request(app).get(`/api/order/couriers/orders`)
                .set("Cookie", `token=${courierToken}`);

            expect(res.status).toBe(200);
            expect(res.body[0]._id).toBe(newOrder._id.toString());
        });
        it("404 not found", async () => {
            await Order.deleteMany({});
            const res = await request(app).get(`/api/order/couriers/orders`)
                .set("Cookie", `token=${courierToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toBe("Not found!");
        });


        it("500 server error order find", async () => {
            jest.spyOn(Order, "find").mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).get(`/api/order/couriers/orders`)
                .set("Cookie", `token=${courierToken}`);

            expect(res.status).toBe(500);
            expect(res.body).toBe("Server error!");
            jest.restoreAllMocks();
        });


    })
})
