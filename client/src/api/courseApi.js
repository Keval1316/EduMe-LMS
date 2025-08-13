import api from './axios';

export const courseApi = {
  getCourses: (params) => api.get('/courses', { params }),
  
  getCourse: (id) => api.get(`/courses/${id}`),
  
  getRecommendedCourses: (params) => api.get('/courses/recommended', { params }),
  
  createCourse: (formData) => api.post('/courses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  updateCourse: (id, formData) => api.put(`/courses/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  
  publishCourse: (id) => api.post(`/courses/${id}/publish`),
  
  getInstructorCourses: () => api.get('/courses/instructor/my-courses'),
  
  enrollInCourse: (id) => api.post(`/courses/${id}/enroll`),
  
  addSection: (courseId, data) => api.post(`/courses/${courseId}/sections`, data),
  updateSection: (courseId, sectionId, data) => api.put(`/courses/${courseId}/sections/${sectionId}`, data),
  deleteSection: (courseId, sectionId) => api.delete(`/courses/${courseId}/sections/${sectionId}`),
  
  addLecture: (courseId, sectionId, formData) => 
    api.post(`/courses/${courseId}/sections/${sectionId}/lectures`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  updateLecture: (courseId, sectionId, lectureId, data) => 
    api.put(`/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}`, data),
  deleteLecture: (courseId, sectionId, lectureId) => 
    api.delete(`/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}`),
  
  addQuiz: (courseId, sectionId, data) => 
    api.post(`/courses/${courseId}/sections/${sectionId}/quiz`, data)
};