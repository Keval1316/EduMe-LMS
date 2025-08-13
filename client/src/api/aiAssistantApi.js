import axios from 'axios';

// Axios instance for the Python FastAPI (recommendation server)
const recoBaseURL = import.meta.env.VITE_RECO_API_URL || 'http://127.0.0.1:8000';
const recoApi = axios.create({ baseURL: recoBaseURL });

/**
 * Send chat messages to the AI assistant (Gemini via FastAPI /chat)
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @param {Object} opts
 * @param {string=} opts.system_prompt
 * @param {string=} opts.course_context
 * @returns {Promise<{reply: string}>}
 */
export async function sendChat(messages, opts = {}) {
  const payload = {
    messages,
    system_prompt: opts.system_prompt,
    course_context: opts.course_context,
  };
  const { data } = await recoApi.post('/chat', payload);
  return data; // { reply }
}
