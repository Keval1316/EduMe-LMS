// controllers/studentController.js
import Student from "../models/Student.js";
import Course from "../models/Course.js";
import Progress from "../models/Progress.js";
import Submission from "../models/Submission.js";
import Quiz from "../models/Quiz.js";
import Review from "../models/Review.js";
import Certificate from "../models/Certificate.js";

export const getStudentProfile = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }).populate("user", "name email");

  if (!student) {
    return res.status(404).json({ message: "Student profile not found" });
  }

  res.status(200).json(student);
};

export const updateStudentProfile = async (req, res) => {
  const { interests, skills, learningGoals } = req.body;

  const student = await Student.findOneAndUpdate(
    { user: req.user._id },
    { $set: { interests, skills, learningGoals } },
    { new: true }
  );

  if (!student) {
    return res.status(404).json({ message: "Student profile not found" });
  }

  res.status(200).json({ message: "Profile updated successfully", student });
};

export const getStudentDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const interests = student.interests || [];

    let interestBasedCourses = [];
    if (interests.length > 0) {
      interestBasedCourses = await Course.find({
        tags: { $in: interests },
      })
        .limit(6)
        .lean();
    }

    // Get course IDs already shown
    const shownCourseIds = interestBasedCourses.map((course) => course._id);

    const exploreMoreCourses = await Course.aggregate([
      { $match: { _id: { $nin: shownCourseIds } } },
      { $sample: { size: 4 } }, // Random 4
    ]);

    res.status(200).json({
      recommendedCourses: interestBasedCourses,
      exploreMore: exploreMoreCourses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const alreadyEnrolled = student.enrolledCourses.includes(courseId);
    if (alreadyEnrolled) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    student.enrolledCourses.push(courseId);
    await student.save();

    res.status(200).json({ message: "Enrolled successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Enrollment failed" });
  }
};

export const getEnrolledCourses = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate({
      path: "enrolledCourses",
      populate: { path: "instructor", select: "name" }, // optional
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.status(200).json({
      enrolledCourses: student.enrolledCourses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch enrolled courses" });
  }
};


export const markLectureCompleted = async (req, res) => {
  const { courseId, lectureId } = req.params;
  const studentId = req.user._id;

  try {
    let progress = await Progress.findOne({ student: studentId, course: courseId });

    if (!progress) {
      progress = await Progress.create({
        student: studentId,
        course: courseId,
        completedLectures: [lectureId],
      });
    } else {
      if (!progress.completedLectures.includes(lectureId)) {
        progress.completedLectures.push(lectureId);
        progress.lastAccessed = Date.now();
        await progress.save();
      }
    }

    res.status(200).json({ message: "Lecture marked as completed", progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update progress" });
  }
};

export const getCourseProgress = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user._id;

  try {
    const progress = await Progress.findOne({
      student: studentId,
      course: courseId,
    });

    if (!progress) {
      return res.status(200).json({ completedLectures: [] });
    }

    res.status(200).json({ completedLectures: progress.completedLectures });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch progress" });
  }
};


export const submitQuiz = async (req, res) => {
  const { courseId, sectionId, quizId } = req.params;
  const studentId = req.user._id;
  const { answers } = req.body; // { questionId: selectedOption }

  try {
    // Check if already submitted
    const exists = await Submission.findOne({ student: studentId, quiz: quizId });
    if (exists) {
      return res.status(400).json({ message: "You have already submitted this quiz." });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Auto-grade quiz
    let score = 0;
    quiz.question.forEach((q) => {
      const selected = answers[q._id];
      if (selected && selected === q.correctOption) {
        score++;
      }
    });

    const submission = await Submission.create({
      student: studentId,
      course: courseId,
      section: sectionId,
      quiz: quizId,
      answers,
      score,
    });

    res.status(201).json({ message: "Quiz submitted successfully", score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit quiz" });
  }
};

export const getStudentQuizSubmission = async (req, res) => {
  const { quizId } = req.params;

  try {
    const submission = await Submission.findOne({
      student: req.user._id,
      quiz: quizId,
    });

    if (!submission) {
      return res.status(404).json({ message: "No submission found" });
    }

    res.status(200).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch submission" });
  }
};

export const getCourseCompletionPercent = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user._id;

  try {
    const course = await Course.findById(courseId).populate({
      path: "sections",
      populate: { path: "lectures" },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Get all lectures in the course
    const allLectures = course.sections.flatMap((section) => section.lectures);
    const totalLectures = allLectures.length;

    if (totalLectures === 0) {
      return res.status(200).json({ percentCompleted: 0 });
    }

    const progress = await Progress.findOne({ student: studentId, course: courseId });
    const completedCount = progress?.completedLectures?.length || 0;

    const percentCompleted = Math.round((completedCount / totalLectures) * 100);

    res.status(200).json({ percentCompleted, totalLectures, completedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to calculate progress" });
  }
};

export const getStudentProfileSettings = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.status(200).json(user);
};

// UPDATE profile fields
export const updateStudentProfileSettings = async (req, res) => {
  const { name, avatar, bio, socialLinks } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name, avatar, bio, socialLinks } },
    { new: true }
  ).select("-password");

  res.status(200).json({ message: "Profile updated", user: updatedUser });
};

// UPDATE password
export const updateStudentPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
};


export const createOrUpdateReview = async (req, res) => {
  const { courseId } = req.params;
  const { rating, comment } = req.body;
  const studentId = req.user._id;

  const student = await Student.findOne({ user: studentId });
  if (!student || !student.enrolledCourses.includes(courseId)) {
    return res.status(403).json({ message: "You are not enrolled in this course" });
  }

  const existingReview = await Review.findOne({ student: studentId, course: courseId });

  if (existingReview) {
    // Update
    existingReview.rating = rating;
    existingReview.comment = comment;
    await existingReview.save();
    return res.status(200).json({ message: "Review updated", review: existingReview });
  }

  // Create new
  const newReview = await Review.create({
    student: studentId,
    course: courseId,
    rating,
    comment,
  });

  res.status(201).json({ message: "Review submitted", review: newReview });
};

export const getStudentReviewForCourse = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user._id;

  const review = await Review.findOne({ student: studentId, course: courseId });

  if (!review) {
    return res.status(404).json({ message: "You haven't reviewed this course yet" });
  }

  res.status(200).json(review);
};


export const toggleWishlistCourse = async (req, res) => {
  const { courseId } = req.params;
  const student = await Student.findOne({ user: req.user._id });

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const isWishlisted = student.wishlistCourses.includes(courseId);

  if (isWishlisted) {
    student.wishlistCourses.pull(courseId); // remove
  } else {
    student.wishlistCourses.push(courseId); // add
  }

  await student.save();

  res.status(200).json({
    message: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
    wishlist: student.wishlistCourses,
  });
};

export const getWishlistCourses = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }).populate({
    path: "wishlistCourses",
    populate: { path: "instructor", select: "name" },
  });

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  res.status(200).json({ wishlist: student.wishlistCourses });
};


export const getCoursesInProgress = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const enrolledCourseIds = student.enrolledCourses;

    const courses = await Course.find({ _id: { $in: enrolledCourseIds } })
      .populate({
        path: "sections",
        populate: { path: "lectures" },
      })
      .populate("instructor", "name");

    const continueCourses = [];

    for (const course of courses) {
      const allLectures = course.sections.flatMap((section) => section.lectures);
      const totalLectures = allLectures.length;

      if (totalLectures === 0) continue;

      const progress = await Progress.findOne({
        student: req.user._id,
        course: course._id,
      });

      const completedCount = progress?.completedLectures?.length || 0;

      const percentCompleted = Math.round((completedCount / totalLectures) * 100);

      if (percentCompleted < 100) {
        continueCourses.push({
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          instructor: course.instructor,
          percentCompleted,
        });
      }
    }

    res.status(200).json({ continueCourses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch ongoing courses" });
  }
};

export const getStudentCertificate = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user._id;

  const cert = await Certificate.findOne({ student: studentId, course: courseId })
    .populate("course", "title")
    .populate("instructor", "name")
    .populate("student", "name");

  if (!cert) {
    return res.status(404).json({ message: "Certificate not available yet." });
  }

  res.status(200).json({
    certificateId: cert.certificateId,
    courseTitle: cert.course.title,
    studentName: cert.student.name,
    instructorName: cert.instructor.name,
    issuedAt: cert.issuedAt,
  });
};

export const getStudentAnalytics = async (req, res) => {
  const userId = req.user._id;

  const student = await Student.findOne({ user: userId });
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const totalCourses = student.enrolledCourses.length;

  // Total lectures completed
  const progressList = await Progress.find({ student: userId });
  const totalLecturesCompleted = progressList.reduce(
    (sum, p) => sum + (p.completedLectures?.length || 0),
    0
  );

  // Total quiz attempts
  const quizCount = await QuizSubmission.countDocuments({ student: userId });

  // Weekly progress (past 7 days)
  const progressGraph = Array(7).fill(0);
  const today = moment().startOf("day");

  progressList.forEach((p) => {
    const updated = moment(p.updatedAt).startOf("day");
    const diff = today.diff(updated, "days");
    if (diff < 7) {
      progressGraph[6 - diff] += (p.completedLectures?.length || 0);
    }
  });

  res.status(200).json({
    totalCourses,
    totalLecturesCompleted,
    quizCount,
    xp: student.totalXP,
    streakCount: student.streakCount,
    progressGraph,
  });
};