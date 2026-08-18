import mongoose, { Document, Schema } from "mongoose";

// Separate from Review on purpose: Review is restaurant-scoped by convention
// (ties into Restaurant.rating's recompute-on-create logic), and Order only
// carries a restaurantTitle string, not a restaurantId ref — reusing Review
// would need an extra resolution step for no real benefit. This keeps "was
// this specific order rated" a trivial unique-index check instead.
export interface IOrderRating {
  orderId: mongoose.Types.ObjectId,
  sender: mongoose.Types.ObjectId,
  restaurantRating: number,
  courierRating?: number | null,
  comment?: string | null,
  // Same "Courier-application-document id, not User id" convention as
  // Order.courierId.
  courierId?: mongoose.Types.ObjectId | null,
}
export interface IOrderRatingDocument extends IOrderRating, Document<mongoose.Types.ObjectId> { }

const OrderRatingSchema = new Schema<IOrderRating>({
  orderId: { type: Schema.Types.ObjectId, required: true, ref: "Order" },
  sender: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  restaurantRating: { type: Number, required: true, min: 1, max: 5 },
  courierRating: { type: Number, default: null, min: 1, max: 5 },
  comment: { type: String, default: null },
  courierId: { type: Schema.Types.ObjectId, default: null, ref: "Courier" },
}, { timestamps: true });

// Enforces "only ratable once" at the DB layer, not just app logic.
OrderRatingSchema.index({ orderId: 1 }, { unique: true });
// Backs the courier-average recompute.
OrderRatingSchema.index({ courierId: 1 });

export default mongoose.model('OrderRating', OrderRatingSchema);
