import mongoose, { mongo, Schema } from "mongoose";

export enum Category {
  All = "All Restaurants",
  FastFood = "Fast Food",
  FineDining = "Fine Dining",
  Healthy = "Healthy",
  Desserts = "Desserts",
}

const RestaurantSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  adress: {
    city: { type: String, required: true },
    street: { type: String, required: true },
    houseNumber: { type: String, required: true },
  },
  phone: { type: String, required: true },
  websiteUrl: String,
  imageUrl: String,
  categories: { type: [String], enum: Object.values(Category), required: true },
  rating: { type: Number, default: 0, required: true },
  startDay: { type: String, required: true },
  endDay: { type: String, required: true },
  startHour: { type: String, required: true },
  endHour: { type: String, required: true },
  dishes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Dish" }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  about: String,
});

export default mongoose.model('Restaurant', RestaurantSchema);