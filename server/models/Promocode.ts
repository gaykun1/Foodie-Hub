import mongoose, { mongo, Schema } from "mongoose";


export type PromocodeType = {
  code: string,
  createdAt: Date,
  discountPercent: number,
}
const PromocodeSchema = new Schema<PromocodeType>({
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now(), expires: 3600 * 24 * 7 },
  discountPercent: { type: Number, required: true },
});

export default mongoose.model('Promocode', PromocodeSchema)