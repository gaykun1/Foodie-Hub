import mongoose, { mongo, Schema } from "mongoose";


export interface IPromocode {
  code: string,
  createdAt: Date,
  discountPercent: number,
  type: "Usual" | "Special",
  isUsed?: boolean,
}
const PromocodeSchema = new Schema<IPromocode>({
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now(), expires: 3600 * 24 * 7 },
  discountPercent: { type: Number, required: true },
  type: { type: String, required: true, enum: ["Usual", "Special"] },
  isUsed: Boolean,
});

export default mongoose.model('Promocode', PromocodeSchema)