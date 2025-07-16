import mongoose, { mongo, Schema } from "mongoose";


interface IUser {
    username: string,
    password: string,
    phoneNumber: string,
    favourites: string[];
    role: string,
    email: string,
    cart: mongoose.Types.ObjectId,
    promocodes: mongoose.Types.ObjectId[] | null,
    usualPromocode: mongoose.Types.ObjectId | null,
    address: {
        street: string,
        houseNumber: string,
        city: string,
    }


}


const userSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, },
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
    phoneNumber: { type: String, unique: true },
    email: { type: String, unique: true },
    address: {
        street: { type: String },
        city: { type: String },
        houseNumber: { type: Number },
    },

    role: { type: String, enum: ["user", "admin", "courier"], default: "user" },
    cart: { type: Schema.Types.ObjectId, ref: "Cart" },
    promocodes: [{ type: Schema.Types.ObjectId, default: null, ref: "Promocode" }],
    usualPromocode: { type: Schema.Types.ObjectId, default: null, ref: "Promocode" },




})

export default mongoose.model<IUser>("User", userSchema);