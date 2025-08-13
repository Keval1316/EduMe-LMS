const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middlewares/validate');
const {
    getEnrollments,
    getEnrollment,
    markLectureComplete,
    submitQuiz,
    getCertificates,
    downloadCertificate,
} = require('../controllers/enrollmentController');
const { auth, roleCheck } = require('../middlewares/auth');

const router = express.Router();

// Student routes
router.get('/', auth, roleCheck(['Student']), getEnrollments);
router.get('/certificates', auth, roleCheck(['Student']), getCertificates);
router.get('/certificates/:certificateId/download', auth, roleCheck(['Student']), downloadCertificate);
router.get('/:courseId', auth, roleCheck(['Student']), [
    param('courseId').isMongoId().withMessage('Invalid courseId')
], validate, getEnrollment);

router.post('/:courseId/lectures/:lectureId/complete', auth, roleCheck(['Student']), [
    param('courseId').isMongoId().withMessage('Invalid courseId'),
    param('lectureId').isMongoId().withMessage('Invalid lectureId'),
    body('watchTime').optional().isInt({ min: 0 }).withMessage('Watch time must be a non-negative integer')
], validate, markLectureComplete);

router.post('/:courseId/sections/:sectionId/quiz', auth, roleCheck(['Student']), [
    param('courseId').isMongoId().withMessage('Invalid courseId'),
    param('sectionId').isMongoId().withMessage('Invalid sectionId'),
    body('answers').isArray().withMessage('Answers must be an array')
], validate, submitQuiz);

module.exports = router;