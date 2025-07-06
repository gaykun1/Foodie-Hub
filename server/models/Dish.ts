import mongoose, { mongo, Schema } from "mongoose";



const DishSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  restaurantId: { type: mongoose.Types.ObjectId, required: true, ref: "restaurant" },
  typeOfFood: { type: String, required: true, enum: ["Appetizers", "Main Courses", "Desserts", "Drinks"] },

});

export default mongoose.model('Dish', DishSchema);