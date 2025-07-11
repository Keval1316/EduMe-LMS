import Certificate from "../models/Certificate.js";
import { v4 as uuidv4 } from "uuid";

export const checkAndIssueCertificate = async ({ studentId, course }) => {
  const exists = await Certificate.findOne({ student: studentId, course: course._id });
  if (exists) return;

  // total lectures
  const allLectures = course.sections.flatMap((sec) => sec.lectures);
  const total = allLectures.length;

  // completed lectures
  const progress = await Progress.findOne({ student: studentId, course: course._id });
  const completed = progress?.completedLectures?.length || 0;

  const percent = Math.round((completed / total) * 100);

  if (percent === 100 && course.hasCertificate) {
    await Certificate.create({
      student: studentId,
      course: course._id,
      instructor: course.instructor,
      certificateId: uuidv4(),
    });
  }
};
