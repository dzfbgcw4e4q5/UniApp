import axios from 'axios';
import { IP } from '../ip';
import authUtils from '../utils/authUtils';

/**
 * Create an axios instance with base configuration
 */
const api = axios.create({
  baseURL: `http://${IP}:3000/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Add request interceptor to include authentication token
 */
api.interceptors.request.use(
  async (config) => {
    const token = await authUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Add response interceptor to handle token expiration
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Improved error logging to handle network errors
    if (error.response) {
      // Server responded with an error status
      console.log(`API error status: ${error.response.status}, URL: ${originalRequest?.url}`);
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.log(`API network error: No response received, URL: ${originalRequest?.url}`);
      console.log(`Network error details: ${error.message}`);
    } else {
      // Error in setting up the request
      console.log(`API request setup error: ${error.message}, URL: ${originalRequest?.url}`);
    }
    
    // If the error is due to an expired token (401) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Attempting to refresh token due to 401 error');
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshed = await authUtils.refreshToken();
        
        if (refreshed) {
          console.log('Token refreshed successfully, retrying original request');
          // If token refresh was successful, retry the original request
          const token = await authUtils.getToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } else {
          console.log('Token refresh failed, rejecting request');
        }
      } catch (refreshError) {
        console.error('Error in token refresh process:', refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * API service for making authenticated requests
 */
const apiService = {
  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role (student, faculty, admin)
   * @returns {Promise<Object>} Login response
   */
  login: async (email, password, role) => {
    const endpoint = 
      role === 'admin' 
        ? 'admin/login'
        : role === 'faculty'
        ? 'faculty/login'
        : 'student/login';
    
    return api.post(endpoint, { email, password });
  },
  
  /**
   * Get student profile
   * @returns {Promise<Object>} Student profile data
   */
  getStudentProfile: async () => {
    return api.get('student/profile');
  },
  
  /**
   * Get student tasks
   * @returns {Promise<Object>} Student tasks data
   */
  getStudentTasks: async () => {
    return api.get('student/tasks');
  },
  
  /**
   * Get student tickets
   * @returns {Promise<Object>} Student tickets data
   */
  getStudentTickets: async () => {
    return api.get('student/tickets');
  },
  
  /**
   * Get student resume
   * @returns {Promise<Object>} Student resume data
   */
  getStudentResume: async () => {
    return api.get('student/resume');
  },
  
  /**
   * Save student resume
   * @param {Object} resumeData - Resume data to save
   * @returns {Promise<Object>} Save response
   */
  saveStudentResume: async (resumeData) => {
    return api.post('student/resume', resumeData);
  },
  
  /**
   * Update student resume
   * @param {Object} resumeData - Resume data to update
   * @returns {Promise<Object>} Update response
   */
  updateStudentResume: async (resumeData) => {
    return api.put('student/resume', resumeData);
  },
  
  /**
   * Create a new ticket
   * @param {Object} ticketData - Ticket data to create
   * @returns {Promise<Object>} Create response
   */
  createTicket: async (ticketData) => {
    return api.post('student/tickets', ticketData);
  },
  
  /**
   * Get faculty profile
   * @returns {Promise<Object>} Faculty profile data
   */
  getFacultyProfile: async () => {
    return api.get('faculty/profile');
  },
  
  /**
   * Get admin profile
   * @returns {Promise<Object>} Admin profile data
   */
  getAdminProfile: async () => {
    return api.get('admin/profile');
  },
};

export default apiService;