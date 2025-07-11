import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { toggleLectureCompletion } from "../controllers/progressController.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("student"));

router.post(
  "/courses/:courseId/lectures/:lectureId/toggle",
  toggleLectureCompletion
);

export default router;
