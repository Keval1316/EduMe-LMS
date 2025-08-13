const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');

// Submit or update a course review
const submitReview = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { rating, comment } = req.body;
        const studentId = req.user.id;

        // Validate input
        if (!rating || !comment) {
            return res.status(400).json({ message: 'Rating and comment are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        if (comment.length > 1000) {
            return res.status(400).json({ message: 'Comment must be less than 1000 characters' });
        }

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if student has completed the course
        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
            isCompleted: true
        });

        if (!enrollment) {
            return res.status(403).json({ 
                message: 'You can only review courses you have completed' 
            });
        }

        // Check if review already exists (for update)
        let review = await Review.findOne({
            student: studentId,
            course: courseId
        });

        const isUpdate = !!review;

        if (review) {
            // Update existing review
            review.rating = rating;
            review.comment = comment;
            await review.save();
        } else {
            // Create new review
            review = new Review({
                student: studentId,
                course: courseId,
                rating,
                comment
            });
            await review.save();
        }

        // Recalculate course rating and review count
        await updateCourseRating(courseId);

        // Populate student info for response
        await review.populate('student', 'name email');

        res.status(isUpdate ? 200 : 201).json({
            message: isUpdate ? 'Review updated successfully' : 'Review submitted successfully',
            review
        });

    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get reviews for a course
const getCourseReviews = async (req, res) => {
    try {
        const { courseId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Get reviews with pagination
        const reviews = await Review.find({ course: courseId })
            .populate('student', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const totalReviews = await Review.countDocuments({ course: courseId });

        res.json({
            reviews,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                hasNext: page < Math.ceil(totalReviews / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get student's review for a course
const getStudentReview = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const review = await Review.findOne({
            student: studentId,
            course: courseId
        }).populate('student', 'name');

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.json({ review });

    } catch (error) {
        console.error('Error fetching student review:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a review
const deleteReview = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const review = await Review.findOneAndDelete({
            student: studentId,
            course: courseId
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Recalculate course rating and review count
        await updateCourseRating(courseId);

        res.json({ message: 'Review deleted successfully' });

    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if student can review a course
const canReviewCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        // Check if student has completed the course
        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
            isCompleted: true
        });

        if (!enrollment) {
            return res.json({ canReview: false, reason: 'Course not completed' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            student: studentId,
            course: courseId
        });

        res.json({
            canReview: true,
            hasExistingReview: !!existingReview,
            existingReview: existingReview || null
        });

    } catch (error) {
        console.error('Error checking review eligibility:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to update course rating
const updateCourseRating = async (courseId) => {
    try {
        const reviews = await Review.find({ course: courseId });
        
        if (reviews.length === 0) {
            await Course.findByIdAndUpdate(courseId, {
                rating: 0,
                reviewCount: 0
            });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal

        await Course.findByIdAndUpdate(courseId, {
            rating: averageRating,
            reviewCount: reviews.length
        });

    } catch (error) {
        console.error('Error updating course rating:', error);
    }
};

module.exports = {
    submitReview,
    getCourseReviews,
    getStudentReview,
    deleteReview,
    canReviewCourse
};
