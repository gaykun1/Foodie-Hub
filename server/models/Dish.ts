import mongoose, { mongo, Schema } from "mongoose";

export interface IDish {
  title: string,
  description: string,
  price: { type: Number, required: true },
  imageUrl: string,
  restaurantId: mongoose.Types.ObjectId,
  typeOfFood: "Appetizers" | "Main Courses" | "Desserts" | "Drinks",
  sold: number,
}

const DishSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant" },
  typeOfFood: { type: String, required: true, enum: ["Appetizers", "Main Courses", "Desserts", "Drinks"] },
  sold: { type: Number, required: true, default: 0 }
});

export default mongoose.model('Dish', DishSchema);