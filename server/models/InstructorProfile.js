import mongoose from "mongoose";

const instructorProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    bio: {
        type: String,
        maxlength: 1000,
    },
    avatar: {
        type: String, // Cloudinary URL
    },
    socialLinks: {
        website: String,
        linkedin: String,
        twitter: String,
        github: String,
    },
}, { timestamps: true });

export default mongoose.model("InstructorProfile", instructorProfileSchema);
