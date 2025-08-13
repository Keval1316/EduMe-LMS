const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Helper to upload a buffer to Cloudinary via upload_stream
const uploadFromBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });

const createCourse = async (req, res) => {
    try {
        const { title, description, price, category, level } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'Thumbnail image is required' });
        }

        // Coerce feature flags from multipart/form-data (strings) to booleans
        const hasGroupDiscussion = req.body.hasGroupDiscussion === 'true' || req.body.hasGroupDiscussion === true;
        const hasCertificate =
            typeof req.body.hasCertificate === 'undefined'
                ? undefined
                : (req.body.hasCertificate === 'true' || req.body.hasCertificate === true);
        const isPublished = req.body.isPublished === 'true' || req.body.isPublished === true;
        const certificateTemplate = req.body.certificateTemplate;

        // Upload thumbnail to Cloudinary using buffer from memory storage
        const imgUpload = await uploadFromBuffer(req.file.buffer, {
            resource_type: 'image',
            folder: 'lms/thumbnails'
        });
        const thumbnailUrl = imgUpload.secure_url;

        const course = new Course({
            title,
            description,
            price,
            thumbnail: thumbnailUrl,
            category,
            level,
            instructor: req.user.id,
            // Only set flags if provided, otherwise let schema defaults apply
            ...(typeof hasGroupDiscussion !== 'undefined' ? { hasGroupDiscussion } : {}),
            ...(typeof hasCertificate !== 'undefined' ? { hasCertificate } : {}),
            ...(typeof certificateTemplate !== 'undefined' && certificateTemplate
                ? { certificateTemplate }
                : {}),
            ...(typeof isPublished !== 'undefined' ? { isPublished } : {})
        });

        await course.save();
        res.status(201).json({ message: 'Course created successfully', course });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a section (title/order)
const updateSection = async (req, res) => {
    try {
        const { courseId, sectionId } = req.params;
        const { title, order } = req.body;

        const course = await Course.findOne({ _id: courseId, instructor: req.user.id });
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const section = course.sections.id(sectionId);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        if (typeof title !== 'undefined') section.title = title;
        if (typeof order !== 'undefined') section.order = order;

        await course.save();
        res.json({ message: 'Section updated successfully', course });
    } catch (error) {
        console.error('Update section error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a section
const deleteSection = async (req, res) => {
    try {
        const { courseId, sectionId } = req.params;
        const course = await Course.findOne({ _id: courseId, instructor: req.user.id });
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const section = course.sections.id(sectionId);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        section.remove();
        await course.save();
        res.json({ message: 'Section deleted successfully', course });
    } catch (error) {
        console.error('Delete section error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a lecture (title/description/order and optionally video)
const updateLecture = async (req, res) => {
    try {
        const { courseId, sectionId, lectureId } = req.params;
        const { title, description, order } = req.body;

        const course = await Course.findOne({ _id: courseId, instructor: req.user.id });
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const section = course.sections.id(sectionId);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        const lecture = section.lectures.id(lectureId);
        if (!lecture) return res.status(404).json({ message: 'Lecture not found' });

        if (typeof title !== 'undefined') lecture.title = title;
        if (typeof description !== 'undefined') lecture.description = description;
        if (typeof order !== 'undefined') lecture.order = order;

        // Optional new video file
        if (req.file) {
            const videoUpload = await cloudinary.uploader.upload(req.file.path, {
                resource_type: 'video',
                folder: 'lms/videos'
            });
            lecture.videoUrl = videoUpload.secure_url;
            try { await fs.promises.unlink(req.file.path); } catch (e) { /* ignore */ }
        }

        await course.save();
        res.json({ message: 'Lecture updated successfully', course });
    } catch (error) {
        console.error('Update lecture error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a lecture
const deleteLecture = async (req, res) => {
    try {
        const { courseId, sectionId, lectureId } = req.params;
        const course = await Course.findOne({ _id: courseId, instructor: req.user.id });
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const section = course.sections.id(sectionId);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        const lecture = section.lectures.id(lectureId);
        if (!lecture) return res.status(404).json({ message: 'Lecture not found' });

        lecture.remove();
        await course.save();
        res.json({ message: 'Lecture deleted successfully', course });
    } catch (error) {
        console.error('Delete lecture error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getCourses = async (req, res) => {
    try {
        const {
            category,
            level,
            search,
            sort = 'newest',
            page = 1,
            limit = 10,
            minPrice,
            maxPrice,
            minRating,
            hasCertificate,
            hasGroupDiscussion
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));

        const query = { isPublished: true };

        if (category) query.category = category;
        if (level) query.level = level;

        // Price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Minimum rating
        if (minRating) {
            query.rating = { $gte: Number(minRating) };
        }

        // Feature flags
        if (typeof hasCertificate !== 'undefined') {
            query.hasCertificate = hasCertificate === 'true' || hasCertificate === true;
        }
        if (typeof hasGroupDiscussion !== 'undefined') {
            query.hasGroupDiscussion = hasGroupDiscussion === 'true' || hasGroupDiscussion === true;
        }

        // Search: prefer text index when available and search length >= 2
        let projection = {};
        let sortSpec = {};
        if (search && String(search).trim().length >= 2) {
            query.$text = { $search: String(search).trim() };
            projection = { score: { $meta: 'textScore' } };
            // Default sort by text score if no explicit sort priority overrides
            sortSpec = { score: { $meta: 'textScore' } };
        }

        // Sorting
        switch (sort) {
            case 'oldest':
                sortSpec = { ...sortSpec, createdAt: 1 };
                break;
            case 'price-low':
                sortSpec = { price: 1 };
                break;
            case 'price-high':
                sortSpec = { price: -1 };
                break;
            case 'rating':
                sortSpec = { rating: -1, reviewCount: -1 };
                break;
            case 'popular':
                sortSpec = { enrolledStudents: -1, rating: -1 };
                break;
            case 'newest':
            default:
                sortSpec = Object.keys(sortSpec).length ? { ...sortSpec, createdAt: -1 } : { createdAt: -1 };
                break;
        }

        const [courses, total] = await Promise.all([
            Course.find(query, projection)
                .populate('instructor', 'fullName')
                .sort(sortSpec)
                .limit(limitNum)
                .skip((pageNum - 1) * limitNum),
            Course.countDocuments(query)
        ]);

        res.json({
            courses,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            total
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'fullName email');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateCourse = async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            instructor: req.user.id
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const updateData = { ...req.body };

        // Coerce boolean flags from multipart/form-data
        if (typeof updateData.hasGroupDiscussion !== 'undefined') {
            updateData.hasGroupDiscussion = updateData.hasGroupDiscussion === 'true' || updateData.hasGroupDiscussion === true;
        }
        if (typeof updateData.hasCertificate !== 'undefined') {
            updateData.hasCertificate = updateData.hasCertificate === 'true' || updateData.hasCertificate === true;
        }
        if (typeof updateData.isPublished !== 'undefined') {
            updateData.isPublished = updateData.isPublished === 'true' || updateData.isPublished === true;
        }

        if (req.file) {
            const imgUpload = await uploadFromBuffer(req.file.buffer, {
                resource_type: 'image',
                folder: 'lms/thumbnails'
            });
            updateData.thumbnail = imgUpload.secure_url;
        }

        Object.assign(course, updateData);
        await course.save();

        res.json({ message: 'Course updated successfully', course });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findOneAndDelete({
            _id: req.params.id,
            instructor: req.user.id
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addSection = async (req, res) => {
    try {
        const { title, order } = req.body;
        const course = await Course.findOne({
            _id: req.params.courseId,
            instructor: req.user.id
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        course.sections.push({
            title,
            order,
            lectures: [],
            quiz: { questions: [] }
        });

        await course.save();
        res.json({ message: 'Section added successfully', course });
    } catch (error) {
        console.error('Add section error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addLecture = async (req, res) => {
    try {
        const { title, description, order } = req.body;
        const { courseId, sectionId } = req.params;

        const course = await Course.findOne({
            _id: courseId,
            instructor: req.user.id
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const section = course.sections.id(sectionId);
        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Lecture video file is required' });
        }

        // Using disk storage path for video upload
        const videoUpload = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'video',
            folder: 'lms/videos'
        });
        const videoUrl = videoUpload.secure_url;

        // Clean up temp file
        try { await fs.promises.unlink(req.file.path); } catch (e) { /* ignore */ }

        section.lectures.push({
            title,
            description,
            videoUrl,
            order
        });

        await course.save();
        res.json({ message: 'Lecture added successfully', course });
    } catch (error) {
        console.error('Add lecture error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addQuiz = async (req, res) => {
    try {
        const { questions, passingScore } = req.body;
        const { courseId, sectionId } = req.params;

        const course = await Course.findOne({
            _id: courseId,
            instructor: req.user.id
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const section = course.sections.id(sectionId);
        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        section.quiz = {
            questions,
            passingScore: passingScore || 70
        };

        await course.save();
        res.json({ message: 'Quiz added successfully', course });
    } catch (error) {
        console.error('Add quiz error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const publishCourse = async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            instructor: req.user.id
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        course.isPublished = true;
        await course.save();

        res.json({ message: 'Course published successfully', course });
    } catch (error) {
        console.error('Publish course error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getInstructorCourses = async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user.id })
            .populate('enrolledStudents', 'fullName email')
            .sort({ createdAt: -1 });

        res.json(courses);
    } catch (error) {
        console.error('Get instructor courses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const enrollInCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const studentId = req.user.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const existingEnrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        const enrollment = new Enrollment({
            student: studentId,
            course: courseId
        });

        await enrollment.save();

        // Add student to course's enrolled students
        course.enrolledStudents.push(studentId);
        await course.save();

        res.json({ message: 'Enrolled successfully', enrollment });
    } catch (error) {
        console.error('Enroll error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getRecommendedCourses = async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, limit = 12 } = req.query;

        let query = { isPublished: true };
        let sortCriteria = {};

        if (user.interests && user.interests.length > 0) {
            // 60% based on interests
            const interestCourses = await Course.find({
                ...query,
                category: { $in: user.interests }
            })
                .populate('instructor', 'fullName')
                .sort({ createdAt: -1 })
                .limit(Math.floor(limit * 0.6));

            // 40% trending/popular courses
            const trendingCourses = await Course.find({
                ...query,
                category: { $nin: user.interests }
            })
                .populate('instructor', 'fullName')
                .sort({ enrolledStudents: -1, rating: -1 })
                .limit(Math.ceil(limit * 0.4));

            const courses = [...interestCourses, ...trendingCourses];

            return res.json({
                courses: courses.slice((page - 1) * limit, page * limit),
                totalPages: Math.ceil(courses.length / limit),
                currentPage: page
            });
        } else {
            // If no interests, show popular courses
            const courses = await Course.find(query)
                .populate('instructor', 'fullName')
                .sort({ enrolledStudents: -1, rating: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Course.countDocuments(query);

            res.json({
                courses,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            });
        }
    } catch (error) {
        console.error('Get recommended courses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
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
};