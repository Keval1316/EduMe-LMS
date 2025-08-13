const Discussion = require('../models/Discussion');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const getDiscussions = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Check if user has access to this course
        const isInstructor = await Course.findOne({
            _id: courseId,
            instructor: req.user.id
        });

        const isEnrolled = await Enrollment.findOne({
            course: courseId,
            student: req.user.id
        });

        if (!isInstructor && !isEnrolled) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const discussions = await Discussion.find({
            course: courseId,
            parentMessage: null
        })
            .populate('author', 'fullName role')
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: 'fullName role'
                }
            })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Discussion.countDocuments({
            course: courseId,
            parentMessage: null
        });

        res.json({
            discussions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get discussions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createDiscussion = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { message, parentMessage } = req.body;

        // Check if user has access to this course
        const isInstructor = await Course.findOne({
            _id: courseId,
            instructor: req.user.id
        });

        const isEnrolled = await Enrollment.findOne({
            course: courseId,
            student: req.user.id
        });

        if (!isInstructor && !isEnrolled) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const discussion = new Discussion({
            course: courseId,
            author: req.user.id,
            message,
            parentMessage: parentMessage || null
        });

        await discussion.save();

        // If this is a reply, add it to parent's replies
        if (parentMessage) {
            await Discussion.findByIdAndUpdate(
                parentMessage,
                { $push: { replies: discussion._id } }
            );
        }

        const populatedDiscussion = await Discussion.findById(discussion._id)
            .populate('author', 'fullName role');

        res.status(201).json({
            message: 'Discussion created successfully',
            discussion: populatedDiscussion
        });
    } catch (error) {
        console.error('Create discussion error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateDiscussion = async (req, res) => {
    try {
        const { discussionId } = req.params;
        const { message } = req.body;

        const discussion = await Discussion.findOne({
            _id: discussionId,
            author: req.user.id
        });

        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        discussion.message = message;
        await discussion.save();

        res.json({
            message: 'Discussion updated successfully',
            discussion
        });
    } catch (error) {
        console.error('Update discussion error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteDiscussion = async (req, res) => {
    try {
        const { discussionId } = req.params;

        const discussion = await Discussion.findOne({
            _id: discussionId,
            author: req.user.id
        });

        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        // Delete all replies
        await Discussion.deleteMany({ parentMessage: discussionId });

        // Remove from parent's replies if it's a reply
        if (discussion.parentMessage) {
            await Discussion.findByIdAndUpdate(
                discussion.parentMessage,
                { $pull: { replies: discussionId } }
            );
        }

        await Discussion.findByIdAndDelete(discussionId);

        res.json({ message: 'Discussion deleted successfully' });
    } catch (error) {
        console.error('Delete discussion error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDiscussionCount = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Check if user is the instructor of this course
        const course = await Course.findOne({
            _id: courseId,
            instructor: req.user.id
        });

        if (!course) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const count = await Discussion.countDocuments({
            course: courseId,
            parentMessage: null // Only count main discussions, not replies
        });

        res.json({ count });
    } catch (error) {
        console.error('Get discussion count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getInstructorDiscussions = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Check if user is the instructor of this course
        const course = await Course.findOne({
            _id: courseId,
            instructor: req.user.id
        });

        if (!course) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const discussions = await Discussion.find({
            course: courseId,
            parentMessage: null
        })
            .populate('author', 'fullName role email')
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: 'fullName role email'
                },
                options: { sort: { createdAt: 1 } }
            })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Discussion.countDocuments({
            course: courseId,
            parentMessage: null
        });

        // Mark discussions that need instructor response
        const discussionsWithStatus = discussions.map(discussion => {
            const hasInstructorReply = discussion.replies.some(reply => 
                reply.author.role === 'instructor'
            );
            
            return {
                ...discussion.toObject(),
                needsResponse: !hasInstructorReply && discussion.author.role === 'student'
            };
        });

        res.json({
            discussions: discussionsWithStatus,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            course: {
                _id: course._id,
                title: course.title,
                thumbnail: course.thumbnail
            }
        });
    } catch (error) {
        console.error('Get instructor discussions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getDiscussions,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion,
    getDiscussionCount,
    getInstructorDiscussions
};