import express from "express"
import { checkRole, login, logout, profile,  signup, updateProfile } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const authRoute = express.Router();

authRoute.post("/signup", signup)
authRoute.post("/login", login);
authRoute.post("/logout", logout);
authRoute.get("/profile/roles", authMiddleware, checkRole);
authRoute.get("/profile", authMiddleware, profile);
authRoute.patch("/profile", authMiddleware, updateProfile);

export default authRoute;