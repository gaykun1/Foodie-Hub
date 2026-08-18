import request from "supertest"
import mongoose from "mongoose";
import { app } from "../../app";
import Restaurant, { Category, IRestaurant, IRestaurantDocument } from "../../models/Restaurant";
import User, { IUserDocument } from "../../models/User";
import Dish, { IDishDocument } from "../../models/Dish";
import jwt from "jsonwebtoken"
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
describe("restaurant api", () => {
    let restaurant1: IRestaurantDocument;
    let restaurant2: IRestaurantDocument;
    let dish: IDishDocument;
    let user: IUserDocument;
    let userToken: string;
    let admin: IUserDocument;
    let adminToken: string;
    beforeEach(async () => {
        user = await User.create({ password: "12312331232Ff", username: "testuser3" });
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
        const dish = await Dish.create({
            title: "newBurger",
            description: "Tasty burger",
            imageUrl: "image.jpg",
            price: 32,
            restaurantId: restaurant1._id,
            typeOfFood: "Desserts"
        });
        restaurant1.dishes.push(dish._id);
        await restaurant1.save();
        restaurant2 = await Restaurant.create({
            title: " Burger Place",
            dishes: [],
            description: "Cool restaurant",
            imageUrl: "someImage",
            categories: [Category.FastFood],
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
            phone: "+312421412"
        })
        userToken = await jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: '1h' });
        admin = await User.create({ password: "12312331232Ff", username: "testadmin3", role: "admin" });
        adminToken = await jwt.sign({ userId: admin._id, role: "admin" }, process.env.JWT_SECRET!, { expiresIn: '1h' });


    })
    afterEach(async () => {
        await Restaurant.deleteMany({});
        await Dish.deleteMany({});
        await User.deleteMany({});
    })
    describe("create restaurant", () => {

        it("500 server error", async () => {
            jest.spyOn(Restaurant, "create").mockImplementationOnce(() => {
                throw new Error("DB error");
            })
            const res = await request(app).post("/api/restaurant/restaurants")
                .set("Cookie", `token=${userToken}`)
                .send({
                    title: "title",
                    description: "description",
                    adress: {
                        city: "city",
                        street: "street",
                        houseNumber: 3,
                    },
                    phone: "phone",
                    websiteUrl: "websiteUrl",
                    imageUrl: "imageUrl",
                    categories: ["Fast Food"],
                    startDay: "startDay",
                    endDay: "endDay",
                    startHour: "startHour",
                    endHour: "endHour",
                });
            expect(res.status).toBe(500);

        })
        it("500 server error", async () => {

            jest.spyOn(Restaurant, "create").mockImplementationOnce(() => {
                throw new Error("DB error");
            })
            const res = await request(app).post("/api/restaurant/restaurants")
                .set("Cookie", `token=${userToken}`)
                .send({
                    title: "title",
                    description: "description",
                    adress: {
                        city: "city",
                        street: "street",
                        houseNumber: 3,
                    },
                    phone: "phone",
                    websiteUrl: "websiteUrl",
                    imageUrl: "imageUrl",
                    categories: ["Fast Food"],
                    startDay: "startDay",
                    endDay: "endDay",
                    startHour: "startHour",
                    endHour: "endHour",
                });
            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Server error");
            jest.restoreAllMocks();
        })
        it("401 unauthenticated", async () => {
            const res = await request(app).post("/api/restaurant/restaurants")
                .send({ title: "title" });
            expect(res.status).toBe(401);
        })
        it("Created restaurant, and links the creator to it", async () => {
            const restaurantData = {
                title: "Some title",
                description: "Some desc",
                city: "City",
                street: "Street",
                houseNumber: 12,
                phone: "+1234567",
                websiteUrl: "http://example.com",
                imageUrl: "some.jpg",
                categories: ["Desserts"],
                startDay: "Monday",
                endDay: "Friday",
                startHour: "8:00",
                endHour: "20:00",
            };
            const res = await request(app).post("/api/restaurant/restaurants")
                .set("Cookie", `token=${userToken}`)
                .send(restaurantData);
            expect(res.status).toBe(201);
            expect(res.body.title).toBe("Some title");

            const updatedUser = await User.findById(user._id);
            expect(updatedUser?.role).toBe("restaurant");
            expect(updatedUser?.restaurantId?.toString()).toBe(res.body._id);
        })
    })
    describe("get filtered restaurants", () => {

        it("500 server error", async () => {

            jest.spyOn(Restaurant, "find").mockImplementationOnce(() => {
                throw new Error("DB error");
            })
            const res = await request(app).get("/api/restaurant/restaurants/filter")
                .query({ categorie: "Fast Food" });
            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Server error");
            jest.restoreAllMocks();
        });
        it("200 filtered all", async () => {
            const res = await request(app).get("/api/restaurant/restaurants/filter")
                .query({ categorie: "All Restaurants" });
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].title).toBe(restaurant1.title);
        });
        it("200 filtered with categorie", async () => {
            const res = await request(app).get("/api/restaurant/restaurants/filter")
                .query({ categorie: "Desserts" });
            expect(res.status).toBe(200);
            expect(res.body[0]._id).toBe(restaurant1._id.toString());
        });
        it("404 filtered with categorie", async () => {
            const res = await request(app).get("/api/restaurant/restaurants/filter")
                .query({ categorie: "Healthy" });
            expect(res.status).toBe(404);
            expect(res.body.message).toEqual("Not Found!");
        });

    })
    describe("get searched restaurants", () => {


        it("200 searched ", async () => {
            const res = await request(app).get("/api/restaurant/restaurants/search")
                .query({ chars: "burg" });
            expect(res.status).toBe(200);
            expect(res.body[0]._id).toBe(restaurant1._id.toString());
            expect(res.body[1]._id).toBe(restaurant2._id.toString());
        });

        it("200(404 actually) -- (return value [])", async () => {
            const res = await request(app).get("/api/restaurant/restaurants/search")
                .query({ chars: "hamburger" });
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("treats regex metacharacters as literal text, not a pattern (regex-injection guard)", async () => {
            // ".*" would match every title if interpolated into $regex unescaped;
            // it doesn't literally appear in either restaurant's title.
            const res = await request(app).get("/api/restaurant/restaurants/search")
                .query({ chars: ".*" });
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("500 server error", async () => {

            jest.spyOn(Restaurant, "find").mockImplementationOnce(() => {
                throw new Error("DB error");
            })
            const res = await request(app).get("/api/restaurant/restaurants/search")
                .query({ chars: "burger" });
            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Search error!");
            jest.restoreAllMocks();
        });

    })
    describe("get  restaurants by id", () => {


        it("200 searched ", async () => {
            const res = await request(app).get(`/api/restaurant/restaurants/${restaurant1._id}`);

            expect(res.status).toBe(200);
            expect(res.body._id).toBe(restaurant1._id.toString());

        });
        it("404 not found", async () => {
            const res = await request(app).get(`/api/restaurant/restaurants/${new mongoose.Types.ObjectId}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Not found!");
        });

        it("500 server error", async () => {

            jest.spyOn(Restaurant, "findOne").mockImplementationOnce(() => {
                throw new Error("DB error");
            })
            const res = await request(app).get(`/api/restaurant/restaurants/${restaurant1._id}`);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Server error");
            jest.restoreAllMocks();
        });

    })
    describe("add  restaurant to favourites", () => {


        it("200 searched ", async () => {
            const res = await request(app).post(`/api/restaurant/restaurants/${restaurant1._id}/favourite`)
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body[0]).toBe(restaurant1._id.toString());

        });


        it("500 server error", async () => {

            jest.spyOn(User, "findById").mockImplementationOnce(() => {
                throw new Error("DB error");
            })
            const res = await request(app).post(`/api/restaurant/restaurants/${restaurant1._id}/favourite`)
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Server error");
            jest.restoreAllMocks();
        });

    })

    describe("add  dish", () => {

        const newDish = {
            title: "newBurger",
            description: "Tasty burger",
            imageUrl: "image.jpg",
            price: 32,
            typeOfFood: "Desserts"
        }

        it("200 deleted ", async () => {
            const res = await request(app).post(`/api/restaurant/dishes`)
                .set("Cookie", `token=${adminToken}`)
                .send({ dish: newDish, id: restaurant1._id });

            expect(res.status).toBe(201);
            expect(res.body.title).toBe("newBurger");
        });
        it("404 not found", async () => {
            const res = await request(app).post(`/api/restaurant/dishes`)
                .set("Cookie", `token=${adminToken}`)
                .send({ dish: newDish, id: new mongoose.Types.ObjectId });
            expect(res.status).toBe(404);
            expect(res.body).toBe("Not found!");
        });

        it("401 unauthenticated", async () => {
            const res = await request(app).post(`/api/restaurant/dishes`).send({ dish: newDish, id: restaurant1._id });
            expect(res.status).toBe(401);
        });

        it("403 restaurant account managing a restaurant it doesn't own", async () => {
            const otherOwner = await User.create({ username: "otherOwner", password: "x", role: "restaurant", restaurantId: restaurant2._id });
            const otherOwnerToken = await jwt.sign({ userId: otherOwner._id, role: "restaurant" }, process.env.JWT_SECRET!, { expiresIn: '1h' });
            const res = await request(app).post(`/api/restaurant/dishes`)
                .set("Cookie", `token=${otherOwnerToken}`)
                .send({ dish: newDish, id: restaurant1._id });
            expect(res.status).toBe(403);
        });

        it("400s a negative price", async () => {
            const res = await request(app).post(`/api/restaurant/dishes`)
                .set("Cookie", `token=${adminToken}`)
                .send({ dish: { ...newDish, price: -5 }, id: restaurant1._id });
            expect(res.status).toBe(400);
        });

        it("500 server error", async () => {

            jest.spyOn(Restaurant, "findById").mockImplementationOnce(() => {
                throw new Error("DB error");
            })
            const res = await request(app).post(`/api/restaurant/dishes`)
                .set("Cookie", `token=${adminToken}`)
                .send({ dish: newDish, id: restaurant2._id });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Server error");
            jest.restoreAllMocks();
        });

    })
    describe("get  dishes by id ", () => {

        it("200 getting smth", async () => {
            const res = await request(app).get(`/api/restaurant/dishes/${restaurant1._id}`);

            expect(res.status).toBe(200);
            expect(res.body.dishes[0]._id).toEqual(restaurant1.dishes[0]._id.toString());
        });

        it("200  getting nothing([])", async () => {
            const res = await request(app).get(`/api/restaurant/dishes/${restaurant2._id}`);

            expect(res.status).toBe(200);
            expect(res.body.dishes).toHaveLength(0);
        });

        it("500 server error", async () => {

            jest.spyOn(Restaurant, "findById").mockImplementationOnce(() => {
                throw new Error("DB error");
            })
            const res = await request(app).get(`/api/restaurant/dishes/${restaurant1._id}`);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Search error!");
            jest.restoreAllMocks();
        });

    })
    describe("delete  dish by id ", () => {

        it("200 deleted ", async () => {
            const res = await request(app).delete(`/api/restaurant/dishes/${restaurant1.dishes[0]._id.toString()}`)
                .set("Cookie", `token=${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toBe("Deleted!");
        });
        it("404 not found", async () => {
            const res = await request(app).delete(`/api/restaurant/dishes/${new mongoose.Types.ObjectId}`)
                .set("Cookie", `token=${adminToken}`);
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Dish not found");
        });

        it("401 unauthenticated", async () => {
            const res = await request(app).delete(`/api/restaurant/dishes/${restaurant1.dishes[0]._id.toString()}`);
            expect(res.status).toBe(401);
        });

        it("403 restaurant account deleting a dish it doesn't own", async () => {
            const otherOwner = await User.create({ username: "otherOwner2", password: "x", role: "restaurant", restaurantId: restaurant2._id });
            const otherOwnerToken = await jwt.sign({ userId: otherOwner._id, role: "restaurant" }, process.env.JWT_SECRET!, { expiresIn: '1h' });
            const res = await request(app).delete(`/api/restaurant/dishes/${restaurant1.dishes[0]._id.toString()}`)
                .set("Cookie", `token=${otherOwnerToken}`);
            expect(res.status).toBe(403);
        });

        it("500 server error", async () => {

            jest.spyOn(Dish, "findByIdAndDelete").mockImplementationOnce(() => {
                throw new Error("DB error");
            })
            const res = await request(app).delete(`/api/restaurant/dishes/${restaurant1.dishes[0]._id.toString()}`)
                .set("Cookie", `token=${adminToken}`);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Search error!");
            jest.restoreAllMocks();
        });

    })



})