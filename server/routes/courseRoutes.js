const express = require('express');
const { body, param } = require('express-validator');
const {
    createCourse,
    getCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    addSection,
    addLecture,
    addQuiz,
    publishCourse,
    getInstructorCourses,
    enrollInCourse,
    getRecommendedCourses,
    updateSection,
    deleteSection,
    updateLecture,
    deleteLecture
} = require('../controllers/courseController');
const { auth, roleCheck } = require('../middlewares/auth');
const { uploadImage, uploadVideo } = require('../middlewares/upload');
const validate = require('../middlewares/validate');

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/recommended', auth, roleCheck(['Student']), getRecommendedCourses);
// Place static paths BEFORE dynamic ':id' to avoid shadowing
router.get('/instructor/my-courses', auth, roleCheck(['Instructor']), getInstructorCourses);

// Student routes
router.post(
  '/:id/enroll',
  auth,
  roleCheck(['Student']),
  [param('id').isMongoId().withMessage('Invalid course id')],
  validate,
  enrollInCourse
);

// Instructor routes
router.post(
  '/',
  auth,
  roleCheck(['Instructor']),
  uploadImage.single('thumbnail'),
  [
    body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
    body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('category').trim().isLength({ min: 1 }).withMessage('Category is required'),
    body('level')
      .trim()
      .isIn(['Beginner', 'Intermediate', 'Advanced'])
      .withMessage('Level must be Beginner, Intermediate, or Advanced')
    ,
    body('hasGroupDiscussion').optional().isBoolean().withMessage('hasGroupDiscussion must be boolean'),
    body('hasCertificate').optional().isBoolean().withMessage('hasCertificate must be boolean'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be boolean'),
    body('certificateTemplate')
      .optional()
      .isIn(['classic', 'modern', 'elegant', 'professional', 'creative'])
      .withMessage('Invalid certificate template')
  ],
  validate,
  createCourse
);

router.put(
  '/:id',
  auth,
  roleCheck(['Instructor']),
  uploadImage.single('thumbnail'),
  [
    param('id').isMongoId().withMessage('Invalid course id'),
    body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
    body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('category').optional().trim().isLength({ min: 1 }).withMessage('Category cannot be empty'),
    body('level').optional().trim().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
    body('hasGroupDiscussion').optional().isBoolean().withMessage('hasGroupDiscussion must be boolean'),
    body('hasCertificate').optional().isBoolean().withMessage('hasCertificate must be boolean'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be boolean'),
    body('certificateTemplate')
      .optional()
      .isIn(['classic', 'modern', 'elegant', 'professional', 'creative'])
      .withMessage('Invalid certificate template')
  ],
  validate,
  updateCourse
);

router.delete(
  '/:id',
  auth,
  roleCheck(['Instructor']),
  [param('id').isMongoId().withMessage('Invalid course id')],
  validate,
  deleteCourse
);

router.post(
  '/:id/publish',
  auth,
  roleCheck(['Instructor']),
  [param('id').isMongoId().withMessage('Invalid course id')],
  validate,
  publishCourse
);

// Course content management
router.post(
  '/:courseId/sections',
  auth,
  roleCheck(['Instructor']),
  [
    param('courseId').isMongoId().withMessage('Invalid course id'),
    body('title').trim().isLength({ min: 1 }).withMessage('Section title is required'),
    body('order').isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
  ],
  validate,
  addSection
);

router.post(
  '/:courseId/sections/:sectionId/lectures',
  auth,
  roleCheck(['Instructor']),
  uploadVideo.single('video'),
  [
    param('courseId').isMongoId().withMessage('Invalid course id'),
    param('sectionId').isMongoId().withMessage('Invalid section id'),
    body('title').trim().isLength({ min: 1 }).withMessage('Lecture title is required'),
    body('order').isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
  ],
  validate,
  addLecture
);

// Update/Delete Section
router.put(
  '/:courseId/sections/:sectionId',
  auth,
  roleCheck(['Instructor']),
  [
    param('courseId').isMongoId().withMessage('Invalid course id'),
    param('sectionId').isMongoId().withMessage('Invalid section id'),
    body('title').optional().trim().isLength({ min: 1 }).withMessage('Section title cannot be empty'),
    body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
  ],
  validate,
  updateSection
);

router.delete(
  '/:courseId/sections/:sectionId',
  auth,
  roleCheck(['Instructor']),
  [
    param('courseId').isMongoId().withMessage('Invalid course id'),
    param('sectionId').isMongoId().withMessage('Invalid section id')
  ],
  validate,
  deleteSection
);

// Update/Delete Lecture
router.put(
  '/:courseId/sections/:sectionId/lectures/:lectureId',
  auth,
  roleCheck(['Instructor']),
  uploadVideo.single('video'),
  [
    param('courseId').isMongoId().withMessage('Invalid course id'),
    param('sectionId').isMongoId().withMessage('Invalid section id'),
    param('lectureId').isMongoId().withMessage('Invalid lecture id'),
    body('title').optional().trim().isLength({ min: 1 }).withMessage('Lecture title cannot be empty'),
    body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
  ],
  validate,
  updateLecture
);

router.delete(
  '/:courseId/sections/:sectionId/lectures/:lectureId',
  auth,
  roleCheck(['Instructor']),
  [
    param('courseId').isMongoId().withMessage('Invalid course id'),
    param('sectionId').isMongoId().withMessage('Invalid section id'),
    param('lectureId').isMongoId().withMessage('Invalid lecture id')
  ],
  validate,
  deleteLecture
);

router.post(
  '/:courseId/sections/:sectionId/quiz',
  auth,
  roleCheck(['Instructor']),
  [
    param('courseId').isMongoId().withMessage('Invalid course id'),
    param('sectionId').isMongoId().withMessage('Invalid section id'),
    body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
    body('passingScore').optional().isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100')
  ],
  validate,
  addQuiz
);

// Dynamic route last to avoid shadowing others
router.get('/:id', [param('id').isMongoId().withMessage('Invalid course id')], validate, getCourse);

module.exports = router;