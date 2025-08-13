const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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
    certificateId: {
        type: String,
        unique: true,
        required: true
    },
    issuedAt: {
        type: Date,
        default: Date.now
    },
    pdfUrl: String,
    // Optional Cloudinary identifiers to enable signed-download generation
    publicId: { type: String },
    resourceType: { type: String, default: 'raw' }
});

module.exports = mongoose.model('Certificate', certificateSchema);