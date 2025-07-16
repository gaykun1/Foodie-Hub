import mongoose, { mongo, Schema } from "mongoose";


export interface IReview  {
  sender: mongoose.Types.ObjectId,
  text: string,
  rating: number,
  restaurantId: mongoose.Types.ObjectId,
}
const ReviewSchema = new Schema<IReview>({
  sender: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  text: { type: String, required: true },
  rating: { type: Number, required: true },
  restaurantId: { type: Schema.Types.ObjectId, required: true, ref: "Restaurant" }
}, { timestamps: true });

export default mongoose.model('Review', ReviewSchema);