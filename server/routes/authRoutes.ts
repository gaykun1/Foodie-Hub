import express from "express"
import { checkIfAdmin, login, logout, profile,  signup, updateProfile } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const authRoute = express.Router();

authRoute.post("/signup", signup)
authRoute.post("/login", login);
authRoute.post("/logout", logout);
authRoute.get("/profile", authMiddleware, profile);
authRoute.get("/check-admin", adminMiddleware, checkIfAdmin);
authRoute.patch("/update-profile", authMiddleware, updateProfile);

export default authRoute;