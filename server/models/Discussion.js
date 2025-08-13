const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    parentMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discussion'
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discussion'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Database indexes for performance optimization
discussionSchema.index({ course: 1, createdAt: -1 }); // Most common query pattern
discussionSchema.index({ author: 1, createdAt: -1 }); // For user's discussion history
discussionSchema.index({ parentMessage: 1 }); // For reply lookups
discussionSchema.index({ course: 1, parentMessage: 1 }); // For course discussions with replies

module.exports = mongoose.model('Discussion', discussionSchema);