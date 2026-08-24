import mongoose, { Document, Schema } from "mongoose";
import { ORDER_STATUSES, type OrderStatusOrDraft } from "../utils/orderStatus";

/** A resolved point on the map, stored so tracking never re-geocodes. */
export interface IGeoPoint {
  lat: number,
  lng: number,
}

export interface IOrder {
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
  shippingPrice: number,
  // Lifecycle vocabulary and legal transitions live in utils/orderStatus.
  // `null` is the pre-checkout draft state.
  status: OrderStatusOrDraft,
  discountPercent: number,
  fullName: string,
  address: {
    city: string,
    countryOrRegion: string,
    houseNumber: number,
    street: string,
    apartmentNumbr?: number;
  },
  /**
   * Restaurant and delivery coordinates, resolved once at checkout.
   *
   * Tracking used to geocode both endpoints through Nominatim every single time
   * the map opened — two third-party round-trips per view, subject to rate
   * limiting, and capable of silently relocating a delivered order if the
   * geocoder returned something different later. Persisting them makes the
   * route a property of the order.
   */
  route?: {
    restaurant?: IGeoPoint | null,
    customer?: IGeoPoint | null,
  } | null,
  // The PaymentIntent this order was actually paid with — needed to issue a
  // real Stripe refund on cancellation.
  paymentIntentId?: string | null,
  cancelledAt?: Date | null,
  cancelledBy?: "customer" | "restaurant" | "admin" | null,
  cancelReason?: string | null,
  refundedAt?: Date | null,
  refundId?: string | null,
  /**
   * Set when the order is being driven by the demo simulator rather than a real
   * courier, so the simulated run is auditable and can be excluded from stats.
   */
  isSimulated?: boolean,
}
export interface IOrderDocument extends IOrder, Document<mongoose.Types.ObjectId> { }

const GeoPointSchema = new Schema<IGeoPoint>({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
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
  discountPercent: { type: Number, default: 0 },
  shippingPrice: { type: Number },
  status: { type: String, enum: [...ORDER_STATUSES], default: null },
  fullName: { type: String },
  address: {
    city: { type: String },
    countryOrRegion: { type: String },
    houseNumber: { type: Number },
    apartmentNumbr: { type: Number },
    street: { type: String },
  },
  route: {
    restaurant: { type: GeoPointSchema, default: null },
    customer: { type: GeoPointSchema, default: null },
  },
  paymentIntentId: { type: String, default: null },
  cancelledAt: { type: Date, default: null },
  cancelledBy: { type: String, enum: ["customer", "restaurant", "admin"], default: null },
  cancelReason: { type: String, default: null },
  refundedAt: { type: Date, default: null },
  refundId: { type: String, default: null },
  isSimulated: { type: Boolean, default: false },
}, { timestamps: true });

// The "does this user already have a pending order" lookup runs on nearly
// every cart/checkout request.
OrderSchema.index({ userId: 1, status: 1 });
// Restaurant dashboards (incoming/recent orders, weekly stats) filter by title
// + status; couriers filter free/assigned orders by courierId + status.
OrderSchema.index({ restaurantTitle: 1, status: 1 });
OrderSchema.index({ courierId: 1, status: 1 });
// Couriers browse unclaimed work by city.
OrderSchema.index({ "address.city": 1, status: 1, courierId: 1 });

export default mongoose.model('Order', OrderSchema);
