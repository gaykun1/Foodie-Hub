import mongoose, { mongo, Schema } from "mongoose";


interface ICourier {
    fullname: string,
    phoneNumber: string,
    email: string,
    transport: string,
    userId: mongoose.Types.ObjectId,
    age: number,
    status: "Working" | "Processing",
}


const courierSchema = new mongoose.Schema<ICourier>({
    phoneNumber: { type: String, unique: true },
    transport: { type: String, unique: true },
    age: { type: Number, unique: true },
    email: { type: String, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Working", "Processing"], default: null },

})

export default mongoose.model<ICourier>("Courier", courierSchema);