import mongoose, { mongo, Schema } from "mongoose";


interface IUser {
    username: string,
    password: string,
    phoneNumber: string,
    favourites: string[];
    role: string,
    email: string,
    cart: mongoose.Types.ObjectId,
}


const userSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, },
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
    phoneNumber: { type: String, unique: true },
    email: { type: String, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    cart: { type: Schema.Types.ObjectId, ref: "Cart" },
})

export default mongoose.model<IUser>("User", userSchema);