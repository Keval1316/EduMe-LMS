const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { generateCertificate } = require('../utils/certificateGenerator');

// Get available certificate templates
const getTemplates = async (req, res) => {
    try {
        const templates = [
            {
                id: 'classic',
                name: 'Classic',
                description: 'Traditional design with elegant borders and serif fonts',
                preview: '/images/templates/classic-preview.jpg'
            },
            {
                id: 'modern',
                name: 'Modern',
                description: 'Clean, contemporary design with gradient accents',
                preview: '/images/templates/modern-preview.jpg'
            },
            {
                id: 'elegant',
                name: 'Elegant',
                description: 'Sophisticated design with gold accents and ornamental elements',
                preview: '/images/templates/elegant-preview.jpg'
            },
            {
                id: 'professional',
                name: 'Professional',
                description: 'Corporate-style with structured layout and signature lines',
                preview: '/images/templates/professional-preview.jpg'
            },
            {
                id: 'creative',
                name: 'Creative',
                description: 'Fun, colorful design with emojis and playful fonts',
                preview: '/images/templates/creative-preview.jpg'
            }
        ];

        res.json(templates);
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update course certificate template (instructor only)
const updateCourseTemplate = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { template } = req.body;

        // Validate template
        const validTemplates = ['classic', 'modern', 'elegant', 'professional', 'creative'];
        if (!validTemplates.includes(template)) {
            return res.status(400).json({ message: 'Invalid template selected' });
        }

        // Find course and verify instructor ownership
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to modify this course' });
        }

        // Update certificate template
        course.certificateTemplate = template;
        await course.save();

        res.json({ 
            message: 'Certificate template updated successfully',
            template: template 
        });
    } catch (error) {
        console.error('Update course template error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get student certificates
const getStudentCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find({ student: req.user.id })
            .populate({
                path: 'course',
                select: 'title thumbnail instructor',
                populate: { path: 'instructor', select: 'fullName' }
            })
            .sort({ issuedAt: -1 });

        res.json(certificates);
    } catch (error) {
        console.error('Get student certificates error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Download certificate (student only)
const downloadCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;

        // Find certificate and verify ownership
        const certificate = await Certificate.findOne({ certificateId })
            .populate({
                path: 'course',
                select: 'title instructor certificateTemplate',
                populate: { path: 'instructor', select: 'fullName' }
            })
            .populate('student', 'fullName');

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        if (certificate.student._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to access this certificate' });
        }

        // Always generate and stream PDF directly to avoid external URL issues
        const Enrollment = require('../models/Enrollment');
        const { generateCertificate } = require('../utils/certificateGenerator');

        const enrollment = await Enrollment.findOne({
            student: certificate.student._id,
            course: certificate.course._id,
            isCompleted: true
        });
        
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found or not completed' });
        }

        // Generate PDF buffer
        const pdfBuffer = await generateCertificate(
            certificate.student.fullName,
            certificate.course.title,
            certificate.course.instructor.fullName,
            enrollment.completedAt,
            certificate.course.certificateTemplate || 'classic'
        );

        // Set headers for PDF response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="certificate-${certificate.certificateId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        
        // Stream the PDF directly
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Download certificate error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get course certificates (instructor only)
const getCourseCertificates = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Verify course ownership
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to access this course' });
        }

        // Get certificates for this course
        const certificates = await Certificate.find({ course: courseId })
            .populate('student', 'fullName email')
            .sort({ issuedAt: -1 });

        res.json(certificates);
    } catch (error) {
        console.error('Get course certificates error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Preview certificate template
const previewTemplate = async (req, res) => {
    try {
        const { template } = req.params;

        // Validate template
        const validTemplates = ['classic', 'modern', 'elegant', 'professional', 'creative'];
        if (!validTemplates.includes(template)) {
            return res.status(400).json({ message: 'Invalid template' });
        }

        // Generate preview certificate with sample data
        const pdfBuffer = await generateCertificate(
            'John Doe',
            'Sample Course Title',
            'Jane Smith',
            new Date(),
            template
        );

        // Set response headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="certificate-preview-${template}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Preview template error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Regenerate certificate (instructor only)
const regenerateCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;

        // Find certificate and verify instructor access
        const certificate = await Certificate.findOne({ certificateId })
            .populate({
                path: 'course',
                select: 'title instructor certificateTemplate',
                populate: { path: 'instructor', select: 'fullName' }
            })
            .populate('student');

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        if (certificate.course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to regenerate this certificate' });
        }

        // Find enrollment to get completion date
        const enrollment = await Enrollment.findOne({
            student: certificate.student._id,
            course: certificate.course._id,
            isCompleted: true
        });

        if (!enrollment) {
            return res.status(400).json({ message: 'Student has not completed this course' });
        }

        // Regenerate certificate with current template
        const template = certificate.course.certificateTemplate || 'classic';
        const pdfBuffer = await generateCertificate(
            certificate.student.fullName,
            certificate.course.title,
            certificate.course.instructor.fullName,
            enrollment.completedAt,
            template
        );

        // Upload new certificate to Cloudinary
        const cloudinary = require('cloudinary').v2;
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'raw',
                    folder: 'lms/certificates',
                    public_id: certificate.certificateId,
                    format: 'pdf',
                    overwrite: true
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(pdfBuffer);
        });

        // Update certificate URL
        certificate.pdfUrl = result.secure_url;
        certificate.issuedAt = new Date();
        await certificate.save();

        res.json({
            message: 'Certificate regenerated successfully',
            certificateId: certificate.certificateId,
            downloadUrl: certificate.pdfUrl
        });
    } catch (error) {
        console.error('Regenerate certificate error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTemplates,
    updateCourseTemplate,
    getStudentCertificates,
    downloadCertificate,
    getCourseCertificates,
    previewTemplate,
    regenerateCertificate
};
