import api from './axios';

export const discussionApi = {
  getDiscussions: (courseId, params) => api.get(`/discussions/${courseId}`, { params }),
  
  getDiscussionCount: (courseId) => api.get(`/discussions/${courseId}/count`),
  
  getInstructorDiscussions: (courseId, params) => api.get(`/discussions/${courseId}/instructor`, { params }),
  
  createDiscussion: (courseId, data) => api.post(`/discussions/${courseId}`, data),
  
  updateDiscussion: (discussionId, data) => api.put(`/discussions/${discussionId}`, data),
  
  deleteDiscussion: (discussionId) => api.delete(`/discussions/${discussionId}`)
};