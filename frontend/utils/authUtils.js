import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IP } from '../ip';

/**
 * Authentication utilities for token management and session handling
 */
const authUtils = {
  /**
   * Check if the token is valid and not expired
   * @returns {Promise<boolean>} True if token is valid, false otherwise
   */
  isTokenValid: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const loginTime = await AsyncStorage.getItem('loginTime');
      
      if (!token || !loginTime) {
        return false;
      }
      
      // Check if token is expired (24 hours)
      const tokenAge = Date.now() - parseInt(loginTime);
      const tokenExpiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (tokenAge > tokenExpiryTime) {
        // Token expired
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  },
  
  /**
   * Refresh the authentication token
   * @returns {Promise<boolean>} True if token was refreshed successfully, false otherwise
   */
  refreshToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userRole = await AsyncStorage.getItem('userRole');
      
      if (!token || !userRole) {
        console.log('No token or userRole found for refresh');
        return false;
      }
      
      console.log(`Attempting to refresh token for role: ${userRole}`);
      
      // Create a direct axios instance for this request to avoid circular dependencies
      const refreshApi = axios.create({
        baseURL: `http://${IP}:3000/api`,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const endpoint = 
        userRole === 'admin' 
          ? 'admin/refresh-token'
          : userRole === 'faculty'
          ? 'faculty/refresh-token'
          : 'student/refresh-token';
      
      console.log(`Calling refresh endpoint: ${endpoint}`);
      
      const response = await refreshApi.post(endpoint, {});
      
      if (response.data && response.data.token) {
        console.log('Token refresh successful, updating storage');
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('loginTime', Date.now().toString());
        return true;
      } else {
        console.log('Token refresh response did not contain a token');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      console.error('Error details:', error.response?.status, error.response?.data);
      return false;
    }
  },
  
  /**
   * Log out the user by clearing stored credentials
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('loginTime');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },
  
  /**
   * Get the current user's role
   * @returns {Promise<string|null>} User role or null if not logged in
   */
  getUserRole: async () => {
    try {
      return await AsyncStorage.getItem('userRole');
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },
  
  /**
   * Get the authentication token
   * @returns {Promise<string|null>} Authentication token or null if not available
   */
  getToken: async () => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }
};

export default authUtils;