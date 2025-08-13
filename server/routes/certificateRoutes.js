const express = require('express');
const router = express.Router();
const {
    getTemplates,
    updateCourseTemplate,
    getStudentCertificates,
    downloadCertificate,
    getCourseCertificates,
    previewTemplate,
    regenerateCertificate
} = require('../controllers/certificateController');
const { auth, roleCheck } = require('../middlewares/auth');

// Public routes (authenticated users)
router.get('/templates', auth, getTemplates);
router.get('/preview/:template', auth, previewTemplate);

// Student routes
router.get('/my-certificates', auth, roleCheck(['Student']), getStudentCertificates);
router.get('/download/:certificateId', auth, roleCheck(['Student']), downloadCertificate);

// Instructor routes
router.put('/course/:courseId/template', auth, roleCheck(['Instructor']), updateCourseTemplate);
router.get('/course/:courseId', auth, roleCheck(['Instructor']), getCourseCertificates);
router.post('/regenerate/:certificateId', auth, roleCheck(['Instructor']), regenerateCertificate);

module.exports = router;
