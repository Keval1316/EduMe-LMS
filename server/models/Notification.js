// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["enrollment", "review", "payout", "system", "message"],
    },
    message: { type: String },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
