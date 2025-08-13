const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const { generateCertificate } = require('../utils/certificateGenerator');
const { sendEmail } = require('../utils/email');
const cloudinary = require('../config/cloudinary');

const getEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user.id })
            .populate({
                path: 'course',
                select: 'title thumbnail instructor sections',
                populate: { path: 'instructor', select: 'fullName' }
            })
            .sort({ enrolledAt: -1 });

        // Filter out enrollments referencing deleted/missing courses
        const safe = enrollments.filter(e => e.course);
        res.json(safe);
    } catch (error) {
        console.error('Get enrollments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getEnrollment = async (req, res) => {
    try {
        const enrollment = await Enrollment.findOne({
            student: req.user.id,
            course: req.params.courseId
        }).populate('course');

        if (!enrollment) {
            // Not enrolled – return a 200 with explicit flag to avoid noisy 404 in client
            return res.json({ enrolled: false });
        }

        res.json({ enrolled: true, enrollment });
    } catch (error) {
        console.error('Get enrollment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const markLectureComplete = async (req, res) => {
    try {
        const { courseId, lectureId } = req.params;
        const { watchTime } = req.body;

        const enrollment = await Enrollment.findOne({
            student: req.user.id,
            course: courseId
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        // Find or create lecture progress
        let lectureProgress = enrollment.lectureProgress.find(
            lp => lp.lectureId.toString() === lectureId
        );

        if (lectureProgress) {
            lectureProgress.completed = true;
            lectureProgress.completedAt = new Date();
            lectureProgress.watchTime = watchTime || 0;
        } else {
            enrollment.lectureProgress.push({
                lectureId,
                completed: true,
                completedAt: new Date(),
                watchTime: watchTime || 0
            });
        }

        // Calculate progress
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const totalLectures = course.sections.reduce((total, section) => {
            return total + (section.lectures?.length || 0);
        }, 0);

        const completedLectures = enrollment.lectureProgress.filter(lp => lp.completed).length;
        if (totalLectures > 0) {
            const rawProgress = (completedLectures / totalLectures) * 100;
            // Clamp between 0 and 100 and round
            enrollment.progress = Math.min(100, Math.max(0, Math.round(rawProgress)));
        } else {
            // No lectures defined; keep existing progress or set to 0
            enrollment.progress = enrollment.progress || 0;
        }

        await enrollment.save();
        await checkCourseCompletion(enrollment._id);

        // Return fresh enrollment state after completion check
        const updatedEnrollment = await Enrollment.findById(enrollment._id);
        res.json({ message: 'Lecture marked as complete', enrollment: updatedEnrollment });
    } catch (error) {
        console.error('Mark lecture complete error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const submitQuiz = async (req, res) => {
    try {
        const { courseId, sectionId } = req.params;
        const { answers } = req.body;

        const enrollment = await Enrollment.findOne({
            student: req.user.id,
            course: courseId
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const section = course.sections.id(sectionId);

        if (!section || !section.quiz || !section.quiz.questions.length) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Calculate score
        let correctAnswers = 0;
        const totalQuestions = section.quiz.questions.length;

        // Validate answers shape and bounds
        if (!Array.isArray(answers) || answers.length !== totalQuestions) {
            return res.status(400).json({ message: 'Answers must match the number of quiz questions' });
        }
        for (let i = 0; i < totalQuestions; i++) {
            const optionCount = section.quiz.questions[i].options?.length || 0;
            const ans = answers[i];
            if (typeof ans !== 'number' || ans < 0 || ans >= optionCount) {
                return res.status(400).json({ message: `Invalid answer for question ${i + 1}` });
            }
        }

        section.quiz.questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const correctOption = question.options.findIndex(opt => opt.isCorrect);

            if (userAnswer === correctOption) {
                correctAnswers++;
            }
        });

        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const passed = score >= section.quiz.passingScore;

        // Find existing attempt for this section and update it, or create new one
        const existingAttemptIndex = enrollment.quizAttempts.findIndex(
            qa => qa.sectionId.toString() === sectionId.toString()
        );

        const quizAttempt = {
            sectionId,
            answers: answers.map((answer, index) => ({
                questionId: section.quiz.questions[index]._id,
                selectedOption: answer
            })),
            score,
            passed,
            attemptedAt: new Date()
        };

        if (existingAttemptIndex >= 0) {
            // Update existing attempt with new score
            enrollment.quizAttempts[existingAttemptIndex] = quizAttempt;
        } else {
            // Add new attempt
            enrollment.quizAttempts.push(quizAttempt);
        }
        await enrollment.save();
        await checkCourseCompletion(enrollment._id);

        // Fetch fresh enrollment status to reflect potential completion
        const updatedEnrollment = await Enrollment.findById(enrollment._id);
        res.json({
            message: 'Quiz submitted successfully',
            score,
            passed,
            correctAnswers,
            totalQuestions,
            isRetake: existingAttemptIndex >= 0,
            enrollment: updatedEnrollment
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const checkCourseCompletion = async (enrollmentId) => {
    try {
        const enrollment = await Enrollment.findById(enrollmentId).populate('course');
        if (!enrollment || !enrollment.course) {
            console.error('Enrollment or course not found');
            return;
        }
        const course = enrollment.course;

        // Check if all lectures are completed
        const totalLectures = course.sections.reduce((total, section) => {
            return total + (section.lectures?.length || 0);
        }, 0);

        const completedLectures = enrollment.lectureProgress.filter(lp => lp.completed).length;
        const allLecturesCompleted = totalLectures === 0 || completedLectures === totalLectures;

        // Check if all quizzes are passed
        const sectionsWithQuizzes = course.sections.filter(section =>
            section.quiz && section.quiz.questions && section.quiz.questions.length > 0
        );

        // If there are no quizzes, this condition is automatically satisfied
        const allQuizzesPassed = sectionsWithQuizzes.length === 0 || 
            sectionsWithQuizzes.every(section => {
                const quizAttempt = enrollment.quizAttempts.find(qa =>
                    qa.sectionId.toString() === section._id.toString() && qa.passed
                );
                return !!quizAttempt;
            });

        const isCompleted = allLecturesCompleted && allQuizzesPassed;

        console.log('Course completion check:', {
            enrollmentId: enrollment._id,
            totalLectures,
            completedLectures,
            sectionsWithQuizzes: sectionsWithQuizzes.length,
            allLecturesCompleted,
            allQuizzesPassed,
            isCompleted,
            currentStatus: enrollment.isCompleted ? 'already completed' : 'not completed'
        });

        if (isCompleted && !enrollment.isCompleted) {
            console.log('Marking course as completed for enrollment:', enrollmentId);
            enrollment.isCompleted = true;
            enrollment.completedAt = new Date();
            enrollment.progress = 100;
            await enrollment.save();

            // Generate certificate if enabled
            if (course.hasCertificate && !enrollment.certificateGenerated) {
                console.log('Generating certificate for enrollment:', enrollmentId);
                await generateAndSendCertificate(enrollment);
            }
        }
    } catch (error) {
        console.error('Check course completion error:', error);
    }
};

const generateAndSendCertificate = async (enrollment) => {
    try {
        const student = await User.findById(enrollment.student);
        const course = await Course.findById(enrollment.course).populate('instructor');

        // Generate certificate ID
        const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Generate PDF with selected template
        const template = course.certificateTemplate || 'classic';
        const pdfBuffer = await generateCertificate(
            student.fullName,
            course.title,
            course.instructor.fullName,
            enrollment.completedAt,
            template
        );

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'raw',
                    folder: 'lms/certificates',
                    public_id: certificateId,
                    format: 'pdf'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(pdfBuffer);
        });

        // Save certificate record
        const certificate = new Certificate({
            student: enrollment.student,
            course: enrollment.course,
            certificateId,
            pdfUrl: result.secure_url,
            publicId: result.public_id, // e.g. 'lms/certificates/CERT-xxxx'
            resourceType: 'raw'
        });

        await certificate.save();

        // Send email with certificate
        await sendEmail({
            email: student.email,
            subject: `Certificate of Completion - ${course.title}`,
            html: `
        <h2>Congratulations!</h2>
        <p>You have successfully completed the course "${course.title}".</p>
        <p>Your certificate is attached to this email.</p>
        <p>Certificate ID: ${certificateId}</p>
      `,
            attachments: [{
                filename: `certificate-${certificateId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        });

        // Mark certificate as generated
        enrollment.certificateGenerated = true;
        // Link the generated certificate to the enrollment for easier lookup
        enrollment.certificate = certificate._id;
        await enrollment.save();

        console.log('Certificate generated and sent successfully');
    } catch (error) {
        console.error('Generate certificate error:', error);
    }
};

const getCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find({ student: req.user.id })
            .populate('course', 'title thumbnail')
            .sort({ issuedAt: -1 });

        // Add a secure backend download URL for each certificate to avoid direct 401s from Cloudinary
        const withDownload = certificates.map((c) => ({
            ...c.toObject(),
            downloadUrl: `/api/enrollments/certificates/${encodeURIComponent(c.certificateId)}/download`,
        }));

        res.json(withDownload);
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Secure download controller: generates a time-limited signed URL (or streams) for private/authenticated raw assets
// Derive publicId from a Cloudinary secure URL for raw assets
function derivePublicIdFromUrl(url) {
    try {
        // Examples:
        // https://res.cloudinary.com/<cloud>/raw/upload/v123/lms/certificates/CERT-xxx.pdf
        // https://res.cloudinary.com/<cloud>/raw/private/v123/lms/certificates/CERT-xxx.pdf
        // https://res.cloudinary.com/<cloud>/raw/authenticated/v123/lms/certificates/CERT-xxx.pdf
        const match = url.match(/\/raw\/(upload|private|authenticated)\/v\d+\/(.+)\.(pdf|PDF)(?:\?.*)?$/);
        if (match && match[2]) return match[2];
    } catch (_) {}
    return null;
}

const downloadCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;
        const cert = await Certificate.findOne({ certificateId, student: req.user.id });
        if (!cert) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        // Otherwise, attempt to generate a short-lived private download URL
        const publicId = cert.publicId || derivePublicIdFromUrl(cert.pdfUrl) || `lms/certificates/${certificateId}`;
        const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutes
        let signedUrl;
        try {
            // Verify resource exists to avoid 404 from Cloudinary download endpoint
            try {
                await cloudinary.api.resource(publicId, { resource_type: cert.resourceType || 'raw' });
            } catch (verifyErr) {
                console.error('Cloudinary resource not found:', { publicId, resourceType: cert.resourceType || 'raw', verifyErr: verifyErr?.message });
                return res.status(404).json({ message: 'Certificate file not found in storage' });
            }
            signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
                resource_type: cert.resourceType || 'raw',
                type: 'upload',
                expires_at: expiresAt,
                attachment: true,
                secure: true,
            });
        } catch (e) {
            console.error('private_download_url generation failed:', e);
        }

        if (signedUrl) {
            return res.redirect(302, signedUrl);
        }

        // Final fallback
        if (cert.pdfUrl) {
            return res.redirect(302, cert.pdfUrl);
        }
        return res.status(404).json({ message: 'Certificate file not available' });
    } catch (error) {
        console.error('Download certificate error:', error);
        return res.status(500).json({ message: 'Unable to generate download link' });
    }
};

module.exports = {
    getEnrollments,
    getEnrollment,
    markLectureComplete,
    submitQuiz,
    getCertificates,
    downloadCertificate
};