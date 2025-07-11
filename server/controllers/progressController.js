import Progress from "../models/Progress.js";
import Lecture from "../models/Lecture.js";
import Course from "../models/Course.js";

export const toggleLectureCompletion = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = req.user._id;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    let progress = await Progress.findOne({ user: userId, course: courseId });

    if (!progress) {
      // First time progress document
      progress = await Progress.create({
        user: userId,
        course: courseId,
        completedLectures: [lectureId],
      });
      return res.status(201).json({ success: true, completed: true });
    }

    const isCompleted = progress.completedLectures.includes(lectureId);

    if (isCompleted) {
      progress.completedLectures.pull(lectureId);
    } else {
      progress.completedLectures.push(lectureId);
    }

    await progress.save();

    res.status(200).json({
      success: true,
      completed: !isCompleted,
    });
  } catch (error) {
    console.error("Error toggling progress:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
