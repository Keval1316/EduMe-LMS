import api from './axios';

export const enrollmentApi = {
  getEnrollments: () => api.get('/enrollments'),
  
  getEnrollment: (courseId) => api.get(`/enrollments/${courseId}`),
  
  markLectureComplete: (courseId, lectureId, data) => 
    api.post(`/enrollments/${courseId}/lectures/${lectureId}/complete`, data),
  
  submitQuiz: (courseId, sectionId, data) => 
    api.post(`/enrollments/${courseId}/sections/${sectionId}/quiz`, data),
  
  getCertificates: () => api.get('/enrollments/certificates')
};