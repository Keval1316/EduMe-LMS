import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { addLecture, deleteLecture, getLecturesBySection } from "../controllers/lectureController.js";
import { getCourseReviews } from "../controllers/reviewController.js";

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(restrictTo("instructor"));

router.post("/", addLecture); // POST /courses/:courseId/sections/:sectionId/lectures

router.get("/", getLecturesBySection); 

router.put("/:lectureId", updateLecture);

router.delete("/:lectureId", deleteLecture);

router.get("/courses/:courseId/reviews", getCourseReviews);

export default router;
