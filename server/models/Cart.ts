import mongoose, { Schema } from "mongoose";

export interface ICart {
  userId: mongoose.Types.ObjectId,
  restaurantId: mongoose.Types.ObjectId,
  items: {
    dishId: mongoose.Types.ObjectId,
    amount: number,
  }[],
}

const CartSchema = new Schema<ICart>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    default: null,
    required: false
  },
  items: [{
    dishId: { type: Schema.Types.ObjectId, required: true, ref: "Dish" },
    amount: { type: Number, required: true, default: 1 },
  }]
});

export default mongoose.model('Cart', CartSchema);