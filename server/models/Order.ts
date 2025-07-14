import mongoose, { mongo, Schema } from "mongoose";
import { createDecipheriv } from "node:crypto";

export type Order = {
  userId: mongoose.Types.ObjectId,
  courierId: mongoose.Types.ObjectId,
  restaurantTitle: string,
  restaurantImage: string,
  approxTime: number,
  items: {
    title: string,
    price: number,
    amount: number,
    imageUrl: string,
  }[],
  totalPrice: number,
  createdAt: Date,

  status: "Delivering" | "Delivered" | "Processing" | "Preparing",

  fullName: string,
  adress: {
    city: string,
    countryOrRegion: string,
    houseNumber: number,
    street: string,
    apartmentNumbr?: number;
  }
}

const OrderSchema = new Schema<Order>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  restaurantTitle: { type: String, required: true },
  restaurantImage: { type: String, required: true },
  approxTime: { type: Number, required: true },
  courierId: { type: Schema.Types.ObjectId, default: null, ref: "User" },
  items: [{
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    price: { type: Number, required: true },
    amount: { type: Number, required: true },
  }],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ["Delivering", "Delivered", "Preparing"], default: null },
  fullName: { type: String },
  adress: {
    city: { type: String },
    countryOrRegion: { type: String },
    houseNumber: { type: Number },
    apartmentNumbr: { type: Number },
    street: { type: String },

  }

},{ timestamps: true });

export default mongoose.model('Order', OrderSchema);