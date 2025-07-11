import Course from "../models/Course.js";
import Section from "../models/Section.js";

export const addSection = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user._id;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Section title is required." });
    }

    // ✅ Ensure course belongs to this instructor
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(404).json({ message: "Course not found or access denied" });
    }

    // ✅ Create section
    const sectionCount = await Section.countDocuments({ course: courseId });

    const section = await Section.create({
      course: courseId,
      title,
      description,
      order: sectionCount,
    });

    res.status(201).json({
      success: true,
      message: "Section added successfully",
      section,
    });
  } catch (error) {
    console.error("Error adding section:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateSection = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const instructorId = req.user._id;

    // ✅ Ensure course belongs to instructor
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Access denied or course not found" });
    }

    // ✅ Find section
    const section = await Section.findOne({ _id: sectionId, course: courseId });
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const { title, description, order } = req.body;

    if (title !== undefined) section.title = title;
    if (description !== undefined) section.description = description;
    if (order !== undefined) section.order = order;

    await section.save();

    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      section,
    });
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const instructorId = req.user._id;

    // ✅ Verify course belongs to the instructor
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Access denied or course not found" });
    }

    // ✅ Find section
    const section = await Section.findOne({ _id: sectionId, course: courseId });
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // ✅ Delete the section
    await section.deleteOne();

    res.status(200).json({
      success: true,
      message: "Section deleted successfully",
      deletedSectionId: sectionId,
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getSectionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user._id;

    // ✅ Check if instructor owns this course
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Access denied or course not found" });
    }

    // ✅ Get all sections for this course
    const sections = await Section.find({ course: courseId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      total: sections.length,
      sections,
    });
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};