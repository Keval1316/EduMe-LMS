import axios from 'axios';

// Create a new Axios instance specifically for the recommendation server
const recommendationApi = axios.create({
  // Prefer env var; fallback to localhost
  baseURL: import.meta.env.VITE_RECO_API_URL || 'http://127.0.0.1:8000',
});

/**
 * Fetches course recommendations from the Python backend.
 * @param {string[]} interests - An array of strings representing user interests.
 * @returns {Promise<object[]>} A promise that resolves to an array of recommended courses.
 */
export const getRecommendedCourses = async (interests) => {
  try {
    const response = await recommendationApi.post('/recommend/', {
      interests: interests,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recommended courses:', error);
    // Depending on how you want to handle errors, you might throw it or return an empty array
    throw error;
  }
};
