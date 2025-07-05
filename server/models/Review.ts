import mongoose, { mongo, Schema } from "mongoose";

export enum Category {
  All = "All Restaurants",
  FastFood = "Fast Food",
  FineDining = "Fine Dining",
  Healthy = "Healthy",
  Desserts = "Desserts",
}
export type ReviewType = {
  sender: mongoose.Types.ObjectId,
  text: string,
  rating: number,
  restaurantId: mongoose.Types.ObjectId,
}
const ReviewSchema = new Schema<ReviewType>({
  sender: { type:Schema.Types.ObjectId, required: true, ref: "User" },
  text: { type: String, required: true },
  rating: { type: Number, required: true },
  restaurantId: { type: Schema.Types.ObjectId, required: true, ref: "Restaurant" }
});

export default mongoose.model('Review', ReviewSchema);