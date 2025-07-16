import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authUtils from '../utils/authUtils';

// Create the authentication context
const AuthContext = createContext();

/**
 * Authentication provider component to manage user authentication state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isValid = await authUtils.isTokenValid();
        const role = await authUtils.getUserRole();
        
        setIsAuthenticated(isValid);
        setUserRole(role);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  /**
   * Login a user
   * @param {string} token - Authentication token
   * @param {string} role - User role
   */
  const login = async (token, role) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userRole', role);
      await AsyncStorage.setItem('loginTime', Date.now().toString());
      
      setIsAuthenticated(true);
      setUserRole(role);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  /**
   * Logout the current user
   */
  const logout = async () => {
    try {
      await authUtils.logout();
      
      setIsAuthenticated(false);
      setUserRole(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  // Context value
  const value = {
    isAuthenticated,
    userRole,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the authentication context
 * @returns {Object} Authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;