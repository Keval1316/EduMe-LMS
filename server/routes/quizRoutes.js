import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { addQuizToSection, deleteQuiz, getQuizzesBySection, updateQuiz } from "../controllers/quizController.js";

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(restrictTo("instructor"));

router.post("/", addQuizToSection); // POST /courses/:courseId/sections/:sectionId/quizzes
router.put("/:quizId", updateQuiz); 
router.delete("/:quizId", deleteQuiz); 
router.get("/", getQuizzesBySection)

export default router;
