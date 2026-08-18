import express from "express"
import { createAddress, deleteAddress, getAddresses, updateAddress } from "../controllers/addressController";

const addressRoute = express.Router();

addressRoute.get("/addresses", getAddresses);
addressRoute.post("/addresses", createAddress);
addressRoute.patch("/addresses/:id", updateAddress);
addressRoute.delete("/addresses/:id", deleteAddress);

export default addressRoute;
