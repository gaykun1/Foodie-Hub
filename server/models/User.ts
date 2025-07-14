import mongoose, { mongo, Schema } from "mongoose";


interface IUser {
    username: string,
    password: string,
    phoneNumber: string,
    favourites: string[];
    role: string,
    email: string,
    cart: mongoose.Types.ObjectId,
    promocodes: {
        code: mongoose.Types.ObjectId| null,
        isUsed: boolean,
    }[],
}


const userSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, },
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
    phoneNumber: { type: String, unique: true },
    email: { type: String, unique: true },
    role: { type: String, enum: ["user", "admin", "courier"], default: "user" },
    cart: { type: Schema.Types.ObjectId, ref: "Cart" },
    promocodes: [
        {
            code: { type: Schema.Types.ObjectId, default: null, ref: "Promocode" },
            isUsed: { type: Boolean, default: false },
        }],

})

export default mongoose.model<IUser>("User", userSchema);