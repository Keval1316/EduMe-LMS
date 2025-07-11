// models/Payout.js
import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },
    payoutDate: { type: Date },
}, { timestamps: true });

export default mongoose.model("Payout", payoutSchema);
