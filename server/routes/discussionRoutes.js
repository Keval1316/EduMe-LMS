const express = require('express');
const { body } = require('express-validator');
const {
    getDiscussions,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion,
    getDiscussionCount,
    getInstructorDiscussions
} = require('../controllers/discussionController');
const { auth } = require('../middlewares/auth');

const router = express.Router();

// Get discussions for a course
router.get('/:courseId', auth, getDiscussions);

// Get discussion count for instructor (for course cards)
router.get('/:courseId/count', auth, getDiscussionCount);

// Get instructor-specific discussions with enhanced data
router.get('/:courseId/instructor', auth, getInstructorDiscussions);

// Create new discussion
router.post('/:courseId', auth, [
    body('message').trim().isLength({ min: 1 }).withMessage('Message is required')
], createDiscussion);

// Update discussion
router.put('/:discussionId', auth, [
    body('message').trim().isLength({ min: 1 }).withMessage('Message is required')
], updateDiscussion);

// Delete discussion
router.delete('/:discussionId', auth, deleteDiscussion);

module.exports = router;