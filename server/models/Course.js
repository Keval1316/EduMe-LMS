// models/Course.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        category: { type: String, required: true },
        thumbnail: { type: String }, // Cloudinary URL
        price: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: false },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        allowDiscussions: { type: Boolean, default: false }, // Group Chat
        hasCertificate: {
            type: Boolean,
            default: false, // instructor can set this
        },
        studentsEnrolled: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        averageRating: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
