import mongoose, { Document, Schema } from "mongoose";

// Referenced by userId rather than embedded as an array on User — matches how
// Cart/Courier/Promocode already reference User by id elsewhere in this
// codebase, and makes default-swapping/CRUD trivial with plain Mongoose
// queries instead of positional array updates. User.address stays untouched
// as a legacy single-address fallback used to prefill checkout when a user
// has no saved addresses yet.
export interface IAddress {
  userId: mongoose.Types.ObjectId,
  label: string,
  street: string,
  houseNumber: number,
  apartmentNumbr?: number | null,
  city: string,
  countryOrRegion: string,
  isDefault: boolean,
}
export interface IAddressDocument extends IAddress, Document<mongoose.Types.ObjectId> { }

const AddressSchema = new Schema<IAddress>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  label: { type: String, default: "Address" },
  street: { type: String, required: true },
  houseNumber: { type: Number, required: true },
  apartmentNumbr: { type: Number, default: null },
  city: { type: String, required: true },
  countryOrRegion: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

AddressSchema.index({ userId: 1 });

export default mongoose.model('Address', AddressSchema);
