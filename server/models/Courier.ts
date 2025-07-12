import mongoose, { mongo, Schema } from "mongoose";


interface ICourier {
    fullname: string,
    phoneNumber: string,
    email: string,
    transport: string,
    userId: mongoose.Types.ObjectId,
    age: number,
    status: "Working" | "Processing",
    city: string,
}


const courierSchema = new mongoose.Schema<ICourier>({
    phoneNumber: { type: String, unique: true, required: true },
    transport: { type: String, default: null },
    fullname: { type: String, required: true },
    city: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String, unique: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Working", "Processing"], required: true },

})

export default mongoose.model<ICourier>("Courier", courierSchema);