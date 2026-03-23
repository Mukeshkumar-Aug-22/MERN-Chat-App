import express from "express";
import { checkAuth, login, signup, updateUserData } from "../controllers/userController.js";
import { protect } from "../middleware/Auth.js";


const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/update-profile", protect, updateUserData);
userRouter.get("/check-auth", protect, checkAuth);

export default userRouter;