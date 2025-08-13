import api from './axios';

export const reviewApi = {
  // Submit or update a review for a course
  submitReview: (courseId, reviewData) => 
    api.post(`/reviews/${courseId}`, reviewData),
  
  // Get all reviews for a course
  getCourseReviews: (courseId, params) => 
    api.get(`/reviews/${courseId}`, { params }),
  
  // Get student's review for a course
  getStudentReview: (courseId) => 
    api.get(`/reviews/${courseId}/student`),
  
  // Check if student can review a course
  canReviewCourse: (courseId) => 
    api.get(`/reviews/${courseId}/can-review`),
  
  // Delete student's review for a course
  deleteReview: (courseId) => 
    api.delete(`/reviews/${courseId}`)
};
