const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const getInstructorDashboard = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const rangeDays = Math.max(1, parseInt(req.query.rangeDays, 10) || 365);
        const startDate = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);

        // Get instructor's courses
        const courses = await Course.find({ instructor: instructorId });
        const courseIds = courses.map(course => course._id);

        // Total courses
        const totalCourses = courses.length;

        // Total enrolled students
        const totalEnrolledStudents = courses.reduce((total, course) => {
            return total + course.enrolledStudents.length;
        }, 0);

        // Total earnings (assuming price per enrollment)
        const totalEarnings = await Enrollment.aggregate([
            { $match: { course: { $in: courseIds }, enrolledAt: { $gte: startDate } } },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'courseInfo'
                }
            },
            { $unwind: '$courseInfo' },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$courseInfo.price' }
                }
            }
        ]);

        // Revenue over time within range (grouped by month)
        const revenueOverTime = await Enrollment.aggregate([
            { $match: { course: { $in: courseIds }, enrolledAt: { $gte: startDate } } },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'courseInfo'
                }
            },
            { $unwind: '$courseInfo' },
            {
                $group: {
                    _id: {
                        year: { $year: '$enrolledAt' },
                        month: { $month: '$enrolledAt' }
                    },
                    revenue: { $sum: '$courseInfo.price' },
                    enrollments: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 12 }
        ]);

        // Student enrollment trends within range
        const enrollmentTrends = await Enrollment.aggregate([
            { $match: { course: { $in: courseIds }, enrolledAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$enrolledAt' },
                        month: { $month: '$enrolledAt' }
                    },
                    enrollments: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 12 }
        ]);

        // Top courses by revenue and enrollments within range
        const topCoursesAgg = await Enrollment.aggregate([
            { $match: { course: { $in: courseIds }, enrolledAt: { $gte: startDate } } },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'courseInfo'
                }
            },
            { $unwind: '$courseInfo' },
            {
                $group: {
                    _id: '$course',
                    title: { $first: '$courseInfo.title' },
                    revenue: { $sum: '$courseInfo.price' },
                    enrollments: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);

        // Course ratings
        const courseRatings = courses.map(course => ({
            courseName: course.title,
            rating: course.rating,
            reviewCount: course.reviewCount
        }));

        res.json({
            totalCourses,
            totalEnrolledStudents,
            totalEarnings: totalEarnings[0]?.totalEarnings || 0,
            revenueOverTime,
            enrollmentTrends,
            courseRatings,
            topCourses: topCoursesAgg
        });
    } catch (error) {
        console.error('Get instructor dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Get student's enrollments with nested populate for instructor
        const enrollmentsRaw = await Enrollment.find({ student: studentId })
            .populate({
                path: 'course',
                select: 'title thumbnail instructor sections',
                populate: { path: 'instructor', select: 'fullName' }
            })
            .sort({ enrolledAt: -1 });

        // Filter out enrollments whose course was deleted or not found
        const enrollments = enrollmentsRaw.filter(e => !!e.course);

        // Recently viewed courses (last 5)
        const recentlyViewed = enrollments.slice(0, 5);

        // Progress tracker
        const progressTracker = enrollments.map(enrollment => ({
            courseId: enrollment.course?._id,
            courseName: enrollment.course?.title || 'Unknown Course',
            progress: typeof enrollment.progress === 'number' ? enrollment.progress : 0,
            isCompleted: !!enrollment.isCompleted
        }));

        // Completed courses count
        const completedCourses = enrollments.filter(e => e.isCompleted).length;

        // Total learning time (approximate)
        const totalLearningTime = enrollments.reduce((total, enrollment) => {
            const lps = Array.isArray(enrollment.lectureProgress) ? enrollment.lectureProgress : [];
            const timeForEnrollment = lps.reduce((time, lp) => time + (lp?.watchTime || 0), 0);
            return total + timeForEnrollment;
        }, 0);

        res.json({
            enrolledCourses: enrollments.length,
            completedCourses,
            totalLearningTime,
            recentlyViewed,
            progressTracker
        });
    } catch (error) {
        console.error('Get student dashboard error:', error?.stack || error);
        res.status(500).json({ message: 'Server error', detail: error?.message || 'Unknown error' });
    }
};

const getEnrolledStudents = async (req, res) => {
    try {
        const courseId = req.params.courseId;

        // Verify course belongs to instructor
        const course = await Course.findOne({
            _id: courseId,
            instructor: req.user.id
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const enrollments = await Enrollment.find({ course: courseId })
            .populate('student', 'fullName email')
            .sort({ enrolledAt: -1 });

        const enrolledStudents = enrollments.map(enrollment => ({
            studentId: enrollment.student._id,
            studentName: enrollment.student.fullName,
            studentEmail: enrollment.student.email,
            enrolledAt: enrollment.enrolledAt,
            progress: enrollment.progress,
            isCompleted: enrollment.isCompleted,
            quizScores: enrollment.quizAttempts.map(qa => ({
                sectionId: qa.sectionId,
                score: qa.score,
                passed: qa.passed
            }))
        }));

        res.json(enrolledStudents);
    } catch (error) {
        console.error('Get enrolled students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getInstructorDashboard,
    getStudentDashboard,
    getEnrolledStudents
};