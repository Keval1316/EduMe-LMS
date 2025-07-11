import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    answers: {
      type: mongoose.Schema.Types.Mixed, // { questionId: selectedOption }
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    feedback: {
      type: String,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ student: 1, quiz: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
