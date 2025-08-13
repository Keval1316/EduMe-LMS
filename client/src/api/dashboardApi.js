import api from './axios';

export const dashboardApi = {
  getInstructorDashboard: (params = {}) => api.get('/dashboard/instructor', { params }),

  getStudentDashboard: (params = {}) => api.get('/dashboard/student', { params }),

  getEnrolledStudents: (courseId) => api.get(`/dashboard/course/${courseId}/students`)
};