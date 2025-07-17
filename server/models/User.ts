import mongoose, { mongo, Schema } from "mongoose";


interface IUser {
    username: string,
    password: string,
    phoneNumber?: string,
    favourites: string[],
    role: "user" | "admin" | "courier" | "restaurant",
    email?: string,
    cart?: mongoose.Types.ObjectId,
    promocodes?: mongoose.Types.ObjectId[] | null,
    usualPromocode?: mongoose.Types.ObjectId | null,
    address: {
        street?: string,
        houseNumber?: number,
        city?: string,
    },
    restaurantId?: mongoose.Types.ObjectId,
}


const userSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, },
    favourites: [{ type: Schema.Types.ObjectId, ref: "Restaurant", default: [] }],
    phoneNumber: { type: String, unique: true, sparse: true, },
    email: { type: String, unique: true, sparse: true, },
    address: {
        type: {
            street: { type: String },
            city: { type: String },
            houseNumber: { type: Number },
        }, default: null
    },
    role: { type: String, enum: ["user", "admin", "courier", "restaurant"], default: "user" },
    cart: { type: Schema.Types.ObjectId, ref: "Cart" },
    promocodes: [{ type: Schema.Types.ObjectId, ref: "Promocode" }],
    usualPromocode: { type: Schema.Types.ObjectId, ref: "Promocode" },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant" },



})

export default mongoose.model<IUser>("User", userSchema);