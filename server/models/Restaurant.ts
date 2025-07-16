import mongoose, { mongo, Schema } from "mongoose";

export enum Category {
  All = "All Restaurants",
  FastFood = "Fast Food",
  FineDining = "Fine Dining",
  Healthy = "Healthy",
  Desserts = "Desserts",
}


export interface IRestaurant  {
  title: string,
  description: String,
  adress: {
    city: string,
    street: string,
    houseNumber: string,
  },
  phone: string,
  websiteUrl: String,
  imageUrl: String,
  categories: Category[],
  rating: number,
  startDay: string,
  endDay: string,
  startHour: string,
  endHour: string,
  dishes: mongoose.Types.ObjectId[],
  reviews: mongoose.Types.ObjectId[],
  about: string,
}

const RestaurantSchema = new Schema<IRestaurant>({
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
  dishes: [{ type:Schema.Types.ObjectId, ref: "Dish" }],
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  about: String,
});

export default mongoose.model('Restaurant', RestaurantSchema);