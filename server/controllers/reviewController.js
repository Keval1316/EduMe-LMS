import Course from "../models/Course.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user._id;

    // ✅ Ensure the course belongs to the instructor
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Access denied. Course not found." });
    }

    // ✅ Fetch all reviews for this course
    const reviews = await Review.find({ course: courseId })
      .populate("student", "name email") // show student info
      .sort({ createdAt: -1 });

    // ✅ Calculate average rating
    const totalRatings = reviews.length;
    const averageRating =
      totalRatings > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

    res.status(200).json({
      success: true,
      totalReviews: totalRatings,
      averageRating: averageRating.toFixed(1),
      reviews,
    });
  } catch (error) {
    console.error("Error fetching course reviews:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
