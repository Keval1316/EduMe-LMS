import express from "express";
import {createCourse, deleteCourse, getInstructorDashboard, getMyCourses, getSingleCourse, updateCourse } from "../controllers/instructorController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { get } from "mongoose";
import sectionRoutes from "./sectionRoutes.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("instructor"));

router.get("/dashboard", getInstructorDashboard);

router.post("/courses", createCourse);

router.get("/courses", getMyCourses);

router.put("/courses/:courseId", updateCourse);

router.delete("/courses/:courseId", deleteCourse);

router.get("/courses/:courseId", getSingleCourse);

router.use("/courses/:courseId/sections", sectionRoutes);



export default router;
