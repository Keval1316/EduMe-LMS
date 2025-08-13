const mongoose = require('mongoose');

const lectureProgressSchema = new mongoose.Schema({
    lectureId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: Date,
    watchTime: {
        type: Number,
        default: 0
    }
});

const quizAttemptSchema = new mongoose.Schema({
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    answers: [{
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOption: Number
    }],
    score: Number,
    passed: Boolean,
    attemptedAt: {
        type: Date,
        default: Date.now
    }
});

const enrollmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    progress: {
        type: Number,
        default: 0
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: Date,
    lectureProgress: [lectureProgressSchema],
    quizAttempts: [quizAttemptSchema],
    certificateGenerated: {
        type: Boolean,
        default: false
    },
    // Reference to the generated Certificate document (if any)
    certificate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Certificate',
        required: false
    }
});

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);