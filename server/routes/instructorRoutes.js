import express from "express";
import {createCourse, deleteCourse, getAllCourseReviews, getInstructorDashboard, getMyCourses, getSingleCourse, searchCourses, updateCourse } from "../controllers/instructorController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { get } from "mongoose";
import sectionRoutes from "./sectionRoutes.js";

export const router = express.Router();

router.use(protect);
router.use(restrictTo("instructor"));

router.get("/dashboard", getInstructorDashboard);

router.post("/courses", createCourse);

router.get("/courses", getMyCourses);
router.get("/courses/search", searchCourses);

router.put("/courses/:courseId", updateCourse);

router.delete("/courses/:courseId", deleteCourse);

router.get("/courses/:courseId", getSingleCourse);

router.use("/courses/:courseId/sections", sectionRoutes);

router.get("/courses/:courseId/reviews", getAllCourseReviews);



export default router;
