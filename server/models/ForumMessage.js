// models/ForumMessage.js
import mongoose from "mongoose";

const forumMessageSchema = new mongoose.Schema({
    thread: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ForumThread",
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    message: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("ForumMessage", forumMessageSchema);
