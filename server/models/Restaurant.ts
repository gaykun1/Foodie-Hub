import mongoose, { Document, Schema } from "mongoose";


export enum Category {
  All = "All Restaurants",
  FastFood = "Fast Food",
  FineDining = "Fine Dining",
  Healthy = "Healthy",
  Desserts = "Desserts",
}


export interface IRestaurant {
  title: string,
  description: string,
  address: {
    city: string,
    street: string,
    houseNumber: number,
  },
  /**
   * Resolved once (at creation or by the seed script) so order checkout can
   * copy it onto the order rather than geocoding the street address on every
   * tracking view.
   */
  location?: { lat: number, lng: number } | null,
  phone: string,
  websiteUrl: string,
  imageUrl: string,
  categories: Category[],
  rating: number,
  startDay: string,
  endDay: string,
  startHour: string,
  endHour: string,
  dishes: mongoose.Types.ObjectId[],
  reviews: mongoose.Types.ObjectId[],
  about: string,
}
export interface IRestaurantDocument extends IRestaurant, Document<mongoose.Types.ObjectId> { }

const RestaurantSchema = new Schema<IRestaurant>({
  title: { type: String, required: true },
  description: String,
  address: {
    city: { type: String, required: true },
    street: { type: String, required: true },
    houseNumber: { type: String, required: true },
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  phone: { type: String, required: true },
  websiteUrl: String,
  imageUrl: String,
  categories: { type: [String], enum: Object.values(Category), required: true },
  rating: { type: Number, default: 0, required: true },
  startDay: { type: String, required: true },
  endDay: { type: String, required: true },
  startHour: { type: String, required: true },
  endHour: { type: String, required: true },
  dishes: [{ type: Schema.Types.ObjectId, ref: "Dish" }],
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  about: String,
});

// Orders reference their restaurant by title, and the category listing is the
// main discovery query.
RestaurantSchema.index({ title: 1 });
RestaurantSchema.index({ categories: 1 });

export default mongoose.model('Restaurant', RestaurantSchema);
