// models/ForumThread.js
import mongoose from "mongoose";

const forumThreadSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: { type: String, required: true },
    content: { type: String },
}, { timestamps: true });

export default mongoose.model("ForumThread", forumThreadSchema);
