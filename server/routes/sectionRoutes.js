import express from "express";
import { addSection, deleteSection, updateSection } from "../controllers/sectionController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import lectureRoutes from "./lectureRoutes.js";
import quizRoutes from "./quizRoutes.js";

const router = express.Router({ mergeParams: true }); // allow access to :courseId

router.use(protect);
router.use(restrictTo("instructor"));

router.get("/", getSectionsByCourse);  

router.post("/", addSection);

router.use("/:sectionId/quizzes", quizRoutes);

router.put("/:sectionId", updateSection);

router.delete("/:sectionId", deleteSection); 

router.use("/:sectionId/lectures", lectureRoutes);

export default router;
