import express from "express";
import {
    createOrUpdateReview,
    enrollInCourse,
    getCourseCompletionPercent,
    getCourseProgress,
    getCoursesInProgress,
    getEnrolledCourses,
    getStudentAnalytics,
    getStudentCertificate,
    getStudentDashboard,
  getStudentProfile,
  getStudentProfileSettings,
  getStudentQuizSubmission,
  getStudentReviewForCourse,
  getWishlistCourses,
  markLectureCompleted,
  submitQuiz,
  toggleWishlistCourse,
  updateStudentPassword,
  updateStudentProfile,
  updateStudentProfileSettings,
} from "../controllers/studentController.js";
import { protect , restrictTo} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("instructor"));

router.get("/profile", getStudentProfile);
router.put("/profile", updateStudentProfile);

router.get("/dashboard", getStudentDashboard);

router.post("/enroll/:courseId", enrollInCourse);
router.get("/enrolled", getEnrolledCourses);

router.post("/progress/:courseId/:lectureId", markLectureCompleted);
router.get("/progress/:courseId", getCourseProgress);

router.post("/submit-quiz/:courseId/:sectionId/:quizId",submitQuiz);
router.get("/submissions/:quizId", getStudentQuizSubmission);

router.get("/progress/:courseId/percent", getCourseCompletionPercent);

router.get("/me",getStudentProfileSettings);
router.put("/me", updateStudentProfileSettings);
router.put("/me/password", updateStudentPassword);

router.post("/review/:courseId", createOrUpdateReview);
router.get("/review/:courseId", getStudentReviewForCourse);

router.post("/wishlist/:courseId",toggleWishlistCourse);
router.get("/wishlist", getWishlistCourses);

router.get("/continue-studying", getCoursesInProgress);

router.get("/certificate/:courseId", getStudentCertificate);

router.get("/dashboard/analytics", protect, getStudentAnalytics);

export default router;
