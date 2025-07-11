import Course from "../models/Course.js";
import Section from "../models/Section.js";
import Quiz from "../models/Quiz.js";


export const addQuizToSection = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const instructorId = req.user._id;
    const { question, options, explanation } = req.body;

    // ✅ Basic validations
    if (!question || !options || options.length < 2) {
      return res.status(400).json({ message: "Question and at least 2 options are required." });
    }

    const hasCorrect = options.some((opt) => opt.isCorrect === true);
    if (!hasCorrect) {
      return res.status(400).json({ message: "At least one option must be marked as correct." });
    }

    // ✅ Verify ownership of the course
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Access denied. Course not found." });
    }

    // ✅ Verify section belongs to the course
    const section = await Section.findOne({ _id: sectionId, course: courseId });
    if (!section) {
      return res.status(404).json({ message: "Section not found in your course." });
    }

    // ✅ Create quiz
    const quiz = await Quiz.create({
      section: sectionId,
      question,
      options,
      explanation,
    });

    res.status(201).json({
      success: true,
      message: "Quiz added to section successfully",
      quiz,
    });
  } catch (error) {
    console.error("Error adding quiz to section:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getQuizzesBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const quizzes = await Quiz.find({ section: sectionId }).select("-__v").sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      total: quizzes.length,
      quizzes,
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { courseId, sectionId, quizId } = req.params;
    const instructorId = req.user._id;
    const { question, options, explanation } = req.body;

    // ✅ Validate course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Access denied. Course not found." });
    }

    // ✅ Validate section
    const section = await Section.findOne({ _id: sectionId, course: courseId });
    if (!section) {
      return res.status(404).json({ message: "Section not found in your course." });
    }

    // ✅ Validate quiz
    const quiz = await Quiz.findOne({ _id: quizId, section: sectionId });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    // ✅ Validate options
    if (options && options.length > 0) {
      const hasCorrect = options.some(opt => opt.isCorrect === true);
      if (!hasCorrect) {
        return res.status(400).json({ message: "At least one option must be marked as correct." });
      }
      quiz.options = options;
    }

    // ✅ Update other fields
    if (question !== undefined) quiz.question = question;
    if (explanation !== undefined) quiz.explanation = explanation;

    await quiz.save();

    res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      quiz,
    });
  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { courseId, sectionId, quizId } = req.params;
    const instructorId = req.user._id;

    // ✅ Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Access denied. Course not found." });
    }

    // ✅ Validate section
    const section = await Section.findOne({ _id: sectionId, course: courseId });
    if (!section) {
      return res.status(404).json({ message: "Section not found in your course." });
    }

    // ✅ Delete the quiz
    const quiz = await Quiz.findOneAndDelete({ _id: quizId, section: sectionId });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
      deletedQuizId: quizId,
    });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};