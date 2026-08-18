import mongoose, { Document, Schema } from "mongoose";



export interface IPromocode {
  code: string,
  createdAt: Date,
  discountPercent: number,
  type: "Usual" | "Special",//usual-for weekend use and special for one time use
  isUsed?: boolean,
}
export interface IPromocodeDocument extends IPromocode, Document<mongoose.Types.ObjectId> { }

const PromocodeSchema = new Schema<IPromocode>({
  code: { type: String, required: true, unique: true },
  // Date.now (reference, not Date.now()) — Mongoose calls it fresh per document.
  // The call form evaluates once at schema-definition time, so every promocode
  // in a server's lifetime was getting the same createdAt (its boot time),
  // which broke the TTL expiry below: they'd all expire together 7 days after
  // boot instead of 7 days after each was actually created.
  createdAt: { type: Date, default: Date.now, expires: 3600 * 24 * 7 },
  discountPercent: { type: Number, required: true, min: 1, max: 100 },
  type: { type: String, required: true, enum: ["Usual", "Special"] },
  isUsed: Boolean,
});

export default mongoose.model('Promocode', PromocodeSchema)