// models/Student.js
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        enrolledCourses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            },
        ],
        wishlistCourses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            },
        ],
        totalXP: {
            type: Number,
            default: 0,
        },
        streakCount: {
            type: Number,
            default: 0,
        },
        lastStudiedDate: {
            type: Date,
        },
        interests: [String],
        skills: [String],
        learningGoals: String,
    },
    { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;
