const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    videoUrl: {
        type: String,
        required: true
    },
    duration: Number,
    order: {
        type: Number,
        required: true
    }
});

const quizQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [{
        text: String,
        isCorrect: Boolean
    }],
    explanation: String
});

const sectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    lectures: [lectureSchema],
    quiz: {
        questions: [quizQuestionSchema],
        passingScore: {
            type: Number,
            default: 70
        }
    },
    order: {
        type: Number,
        required: true
    }
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sections: [sectionSchema],
    category: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    hasGroupDiscussion: {
        type: Boolean,
        default: false
    },
    hasCertificate: {
        type: Boolean,
        default: true
    },
    certificateTemplate: {
        type: String,
        enum: ['classic', 'modern', 'elegant', 'professional', 'creative'],
        default: 'classic'
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    rating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for performance and searchability
// Text index for searching by title/description
courseSchema.index({ title: 'text', description: 'text' });
// Common filters and sorts
courseSchema.index({ category: 1, level: 1, isPublished: 1 });
courseSchema.index({ instructor: 1, createdAt: -1 });
courseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Course', courseSchema);