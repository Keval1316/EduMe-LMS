import Course from "../models/Course.js";
import Review from "../models/Review.js";
import Payout from "../models/Payout.js";

// ✅ Get Dashboard Stats
export const getInstructorDashboard = async (req, res) => {
  try {
    const instructorId = req.user._id;

    // Total courses
    const totalCourses = await Course.countDocuments({ instructor: instructorId });

    // Total enrolled students
    const courses = await Course.find({ instructor: instructorId }).select("studentsEnrolled");
    const studentSet = new Set();
    courses.forEach(course => {
      course.studentsEnrolled.forEach(student => studentSet.add(student.toString()));
    });

    // Total earnings (from payouts)
    const payouts = await Payout.find({ instructor: instructorId });
    const totalEarnings = payouts.reduce((acc, payout) => acc + payout.amount, 0);

    // Average rating across all courses
    const reviews = await Review.find({ course: { $in: courses.map(c => c._id) } });
    const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = reviews.length ? (totalRating / reviews.length).toFixed(1) : 0;

    return res.status(200).json({
      totalCourses,
      totalStudents: studentSet.size,
      totalEarnings,
      averageRating,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const createCourse = async (req, res) => {
  try {
    const instructorId = req.user._id;

    const {
      title,
      description,
      category,
      price,
      thumbnail,
      allowDiscussions,
    } = req.body;

    // Validation
    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description, and category are required." });
    }

    // Create course
    const newCourse = await Course.create({
      title,
      description,
      category,
      price: price || 0,
      thumbnail,
      allowDiscussions: allowDiscussions || false,
      instructor: instructorId,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const instructorId = req.user._id;

    const courses = await Course.find({ instructor: instructorId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find course by ID and instructor
    const course = await Course.findOne({
      _id: courseId,
      instructor: req.user._id,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found or access denied" });
    }

    // Fields that can be updated
    const updatableFields = [
      "title",
      "description",
      "category",
      "price",
      "thumbnail",
      "allowDiscussions",
      "isPublished"
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find and delete course only if owned by instructor
    const course = await Course.findOneAndDelete({
      _id: courseId,
      instructor: req.user._id,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found or access denied" });
    }

    // Optionally: delete related sections, lectures, etc. (implement later)

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      deletedCourseId: courseId,
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getSingleCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findOne({
      _id: courseId,
      instructor: req.user._id,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found or access denied" });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Error fetching single course:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



export const getInstructorDashboardStats = async (req, res) => {
  try {
    const instructorId = req.user._id;

    // ✅ Fetch all instructor's courses
    const courses = await Course.find({ instructor: instructorId });

    const totalCourses = courses.length;

    // ✅ Count total enrolled students across all courses
    const totalEnrollments = courses.reduce((sum, course) => {
      return sum + (course.enrolledStudents?.length || 0);
    }, 0);

    // ✅ Get all course IDs
    const courseIds = courses.map(course => course._id);

    // ✅ Calculate average rating from reviews
    const ratingAgg = await Review.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);
    const averageCourseRating = ratingAgg[0]?.avgRating?.toFixed(1) || 0;

    // ✅ Monthly earnings (if Payment model is used)
    const monthlyEarnings = await Payout.aggregate([
      { $match: { instructor: instructorId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalCourses,
        totalEnrollments,
        averageCourseRating,
        monthlyEarnings,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



export const getAllCourseReviews = async (req, res) => {
  const { courseId } = req.params;

  const reviews = await Review.find({ course: courseId })
    .populate("student", "name avatar")
    .sort({ createdAt: -1 });

  res.status(200).json(reviews);
};

export const searchCourses = async (req, res) => {
  const {
    query = "",
    category,
    level,
    minRating,
  } = req.query;

  const searchQuery = {
    $and: [],
  };

  // Full-text search
  if (query.trim()) {
    searchQuery.$and.push({
      $text: { $search: query },
    });
  }

  // Filters
  if (category) {
    searchQuery.$and.push({ category });
  }

  if (level) {
    searchQuery.$and.push({ level });
  }

  if (minRating) {
    searchQuery.$and.push({ averageRating: { $gte: Number(minRating) } });
  }

  if (searchQuery.$and.length === 0) {
    delete searchQuery.$and;
  }

  const courses = await Course.find(searchQuery, {
    score: { $meta: "textScore" },
  })
    .sort({ score: { $meta: "textScore" } })
    .limit(20)
    .populate("instructor", "name");

  res.status(200).json(courses);
};