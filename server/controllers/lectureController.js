import Course from "../models/Course.js";
import Section from "../models/Section.js";
import Lecture from "../models/Lecture.js";

export const addLecture = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const instructorId = req.user._id;
    const { title, description, videoUrl, duration, attachmentUrl } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ message: "Title and video URL are required" });
    }

    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Access denied. You don't own this course." });
    }

    const section = await Section.findOne({ _id: sectionId, course: courseId });
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const lectureCount = await Lecture.countDocuments({ section: sectionId });

    const lecture = await Lecture.create({
      section: sectionId,
      title,
      description,
      videoUrl,
      duration: duration || 0,
      attachmentUrl,
      order: lectureCount,
    });

    res.status(201).json({
      success: true,
      message: "Lecture added successfully",
      lecture,
    });
  } catch (error) {
    console.error("Error adding lecture:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getLecturesBySection = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const instructorId = req.user._id;

    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Access denied. Course not found." });
    }

    const section = await Section.findOne({ _id: sectionId, course: courseId });
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const lectures = await Lecture.find({ section: sectionId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      total: lectures.length,
      lectures,
    });
  } catch (error) {
    console.error("Error fetching lectures:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const updateLecture = async (req, res) => {
  try {
    const { courseId, sectionId, lectureId } = req.params;
    const instructorId = req.user._id;
    const { title, description, videoUrl, duration, attachmentUrl, order } = req.body;

    // ✅ Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Access denied. Course not found." });
    }

    // ✅ Check if section exists in the course
    const section = await Section.findOne({ _id: sectionId, course: courseId });
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // ✅ Find the lecture
    const lecture = await Lecture.findOne({ _id: lectureId, section: sectionId });
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    // ✅ Update fields
    if (title !== undefined) lecture.title = title;
    if (description !== undefined) lecture.description = description;
    if (videoUrl !== undefined) lecture.videoUrl = videoUrl;
    if (duration !== undefined) lecture.duration = duration;
    if (attachmentUrl !== undefined) lecture.attachmentUrl = attachmentUrl;
    if (order !== undefined) lecture.order = order;

    await lecture.save();

    res.status(200).json({
      success: true,
      message: "Lecture updated successfully",
      lecture,
    });
  } catch (error) {
    console.error("Error updating lecture:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteLecture = async (req, res) => {
  try {
    const { courseId, sectionId, lectureId } = req.params;
    const instructorId = req.user._id;

    // ✅ Check course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Access denied. Course not found." });
    }

    // ✅ Validate section
    const section = await Section.findOne({ _id: sectionId, course: courseId });
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // ✅ Find and delete lecture
    const lecture = await Lecture.findOneAndDelete({ _id: lectureId, section: sectionId });
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found or already deleted" });
    }

    res.status(200).json({
      success: true,
      message: "Lecture deleted successfully",
      deletedLectureId: lectureId,
    });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};