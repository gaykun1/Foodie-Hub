import mongoose, { mongo, Schema } from "mongoose";

export enum Category {
  All = "All Restaurants",
  FastFood = "Fast Food",
  FineDining = "Fine Dining",
  Healthy = "Healthy",
  Desserts = "Desserts",
}

const ReviewSchema = new Schema({
  sender: { type: mongoose.Types.ObjectId, required: true ,ref:"User"},
  text: { type: String, required: true },
  rating: { type: Number, required: true },
  restaurantId:{type:mongoose.Types.ObjectId,required:true,ref:"Restaurant"}
});

export default mongoose.model('Review', ReviewSchema);