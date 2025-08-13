const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const {
    submitReview,
    getCourseReviews,
    getStudentReview,
    deleteReview,
    canReviewCourse
} = require('../controllers/reviewController');

// Submit or update a review for a course
router.post('/:courseId', auth, submitReview);

// Get all reviews for a course (public)
router.get('/:courseId', getCourseReviews);

// Get student's review for a course
router.get('/:courseId/student', auth, getStudentReview);

// Check if student can review a course
router.get('/:courseId/can-review', auth, canReviewCourse);

// Delete student's review for a course
router.delete('/:courseId', auth, deleteReview);

module.exports = router;
