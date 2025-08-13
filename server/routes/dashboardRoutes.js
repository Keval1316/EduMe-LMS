const express = require('express');
const {
    getInstructorDashboard,
    getStudentDashboard,
    getEnrolledStudents
} = require('../controllers/dashboardController');
const { auth, roleCheck } = require('../middlewares/auth');

const router = express.Router();

// Instructor dashboard
router.get('/instructor', auth, roleCheck(['Instructor']), getInstructorDashboard);

// Student dashboard
router.get('/student', auth, roleCheck(['Student']), getStudentDashboard);

// Get enrolled students for a course
router.get('/course/:courseId/students', auth, roleCheck(['Instructor']), getEnrolledStudents);

module.exports = router;