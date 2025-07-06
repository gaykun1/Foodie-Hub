import mongoose, { mongo, Schema } from "mongoose";
import { createDecipheriv } from "node:crypto";

export type Order = {
  userId: mongoose.Types.ObjectId,
  items: {
    title: string,
    price: number,
    amount: number,
  }[],
  totalPrice: number,
  createdAt: Date,
}

const OrderSchema = new Schema<Order>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  items: [{
    title: { type: String, required: true },
    price: { type: Number, required: true },
    amount: { type: Number, required: true },
  }],
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, required: true, default: Date.now() },


});

export default mongoose.model('Order', OrderSchema);