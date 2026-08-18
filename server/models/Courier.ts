import mongoose, { Document, Schema } from "mongoose";



interface ICourier  {
    fullname: string,
    phoneNumber: string,
    email: string,
    transport: string,
    userId: mongoose.Types.ObjectId,
    age: number,
    status: "Working" | "Processing",//Working means -application has been approved and Processing - interviewing
    city: string,
    rating: number | null,
    ratingCount: number,
}
export interface ICourierDocument extends ICourier, Document<mongoose.Types.ObjectId> { }


const courierSchema = new mongoose.Schema<ICourier>({
    phoneNumber: { type: String, unique: true, required: true },
    transport: { type: String, default: null },
    fullname: { type: String, required: true },
    city: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String, unique: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Working", "Processing"], required: true },
    rating: { type: Number, default: null },
    ratingCount: { type: Number, default: 0 },

})

export default mongoose.model<ICourier>("Courier", courierSchema);