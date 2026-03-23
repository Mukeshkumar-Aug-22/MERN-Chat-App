import express from "express";
import { protect } from "../middleware/Auth.js";
import { getMessages, getUsersForSidebar, markMessagesAsSeen, sendMessage } from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protect, getUsersForSidebar);
messageRouter.get("/:id", protect, getMessages);
messageRouter.put("/mark/:id", protect, markMessagesAsSeen);
messageRouter.post("/send/:id", protect, sendMessage);

export default messageRouter;
