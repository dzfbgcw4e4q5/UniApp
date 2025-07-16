import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
} from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import authUtils from '../utils/authUtils';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { IP, testServerConnection } from '../ip';
import { LinearGradient } from 'expo-linear-gradient';

// Import reusable components
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import TextLink from '../components/TextLink';

const { width, height } = Dimensions.get('window');

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  
  // Run entrance animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  
  const checkServerConnection = async () => {
    try {
      setConnectionStatus('checking');
      const result = await testServerConnection();
      
      if (result.success) {
        setConnectionStatus('connected');
        Alert.alert(
          'Connection Successful', 
          `Successfully connected to server at ${IP}:3000\n\nServer response: ${JSON.stringify(result.data)}`
        );
      } else {
        setConnectionStatus('failed');
        Alert.alert(
          'Connection Failed', 
          `Could not connect to server at ${IP}:3000\n\nError: ${result.error}\n\nPlease check:\n1. Server is running\n2. IP address is correct\n3. You're on the same network`
        );
      }
    } catch (error) {
      setConnectionStatus('failed');
      Alert.alert(
        'Connection Test Error', 
        `Error testing connection: ${error.message}`
      );
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      // Input validation with specific error messages
      if (!email && !password) {
        Alert.alert(
          'Missing Information', 
          'Please enter both your university email and password to continue.'
        );
        setLoading(false);
        return;
      }
      
      if (!email) {
        Alert.alert(
          'Email Required', 
          'Please enter your university email address.'
        );
        setLoading(false);
        return;
      }
      
      if (!password) {
        Alert.alert(
          'Password Required', 
          'Please enter your password to continue.'
        );
        setLoading(false);
        return;
      }
      
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert(
          'Invalid Email Format', 
          'Please enter a valid email address (e.g., student@university.edu).'
        );
        setLoading(false);
        return;
      }

      const roles = ['student', 'faculty', 'admin'];
      let loginSuccess = false;
      let lastError = null;

      for (const role of roles) {
        try {
          const response = await apiService.login(email, password, role);

          if (response.data.token) {
            // Store authentication data
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('userRole', role);
            
            // Store login timestamp for token expiration handling
            await AsyncStorage.setItem('loginTime', Date.now().toString());

            // Navigate to appropriate dashboard
            navigation.replace(
              role === 'student'
                ? 'StudentDashboard'
                : role === 'faculty'
                ? 'FacultyDashboard'
                : 'AdminDashboard'
            );

            loginSuccess = true;
            break;
          }
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      if (!loginSuccess) {
        // Check for specific error conditions
        if (lastError?.response?.status === 401) {
          Alert.alert(
            'Authentication Failed', 
            'Invalid credentials. Please check your email and password and try again.'
          );
        } else if (lastError?.response?.status === 403) {
          Alert.alert(
            'Account Locked', 
            'Your account has been temporarily locked due to multiple failed login attempts. Please contact the IT helpdesk.'
          );
        } else if (lastError?.response?.status === 404) {
          Alert.alert(
            'Account Not Found', 
            'No account found with this email address. Please check your email or register for a new account.'
          );
        } else {
          Alert.alert(
            'Authentication Failed', 
            'Unable to authenticate. Please check your credentials or contact the IT helpdesk for assistance.'
          );
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Enhanced network error handling
      if (error.message && (
          error.message.includes('Network Error') || 
          error.message.includes('connect') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('timeout')
      )) {
        Alert.alert(
          'Connection Error', 
          'Unable to connect to the university portal. Please check that:\n\n' +
          '1. The server is running\n' +
          '2. Your device is connected to the same network as the server\n' +
          '3. The server IP address (192.168.0.68) is correct\n\n' +
          'Technical details: ' + error.message
        );
      } else if (error.response) {
        // Server returned an error response
        Alert.alert(
          'Server Error', 
          `Error code: ${error.response.status}. Please try again later or contact support.`
        );
      } else {
        // Generic error handling
        Alert.alert(
          'Login Error', 
          'An unexpected error occurred. Please try again later or contact the IT helpdesk.\n\n' +
          'Technical details: ' + (error.message || 'Unknown error')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#4f46e5', '#7c3aed', '#8b5cf6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
        {/* Set the title for the screen - visible in some contexts */}
        <Text style={{ height: 0, width: 0, opacity: 0 }}>Campus Connect - University Portal</Text>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo and Header Section */}
            <Animated.View 
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <LinearGradient
                colors={['#fff', '#f5f3ff']}
                style={styles.logoCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoText}>UNI</Text>
              </LinearGradient>
              <Text style={styles.appName}>Campus Connect</Text>
              <Text style={styles.appTagline}>Your Complete University Portal</Text>
            </Animated.View>

            {/* Login Form Section */}
            <Animated.View 
              style={[
                styles.formCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <View style={styles.formHeader}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
              </View>

              <FormInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="University email address"
                iconName="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                accessibilityLabel="Email input field"
                accessibilityHint="Enter your university email address"
                textContentType="emailAddress"
                autoCompleteType="email"
                style={styles.input}
              />

              <FormInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your secure password"
                iconName="lock-closed-outline"
                secureTextEntry={true}
                isSecureTextVisible={isPasswordVisible}
                onToggleSecureEntry={() => setIsPasswordVisible(!isPasswordVisible)}
                editable={!loading}
                accessibilityLabel="Password input field"
                accessibilityHint="Enter your secure password"
                textContentType="password"
                autoCompleteType="password"
                style={styles.input}
              />

              <TextLink
                text="Forgot Password?"
                onPress={() => navigation.navigate('ForgotPassword')}
                disabled={loading}
                accessibilityLabel="Forgot Password"
                accessibilityHint="Navigate to password reset screen"
                style={styles.forgotPassword}
              />

              <PrimaryButton
                title="Sign In"
                onPress={handleLogin}
                isLoading={loading}
                iconName="log-in-outline"
                accessibilityLabel="Sign In"
                accessibilityHint="Log in to your university account"
                style={styles.loginButton}
              />
              
              <View style={styles.securityNote}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#6b7280" style={styles.securityIcon} />
                <Text style={styles.securityText}>Secure, encrypted connection</Text>
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social login options removed as per user request */}

              <View style={styles.register}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TextLink
                  text="Register Now"
                  onPress={() => navigation.navigate('Registration')}
                  disabled={loading}
                  accessibilityLabel="Register Now"
                  accessibilityHint="Navigate to registration screen"
                />
              </View>
            </Animated.View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>© 2023 Campus Connect</Text>
              <Text style={styles.footerText}>v1.0.0</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: Constants.statusBarHeight,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 30,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4f46e5',
    letterSpacing: 2,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  appTagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: 30,
    paddingTop: 35,
    paddingBottom: 30,
    marginHorizontal: 20,
    shadowColor: '#1e1b4b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  formHeader: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e1b4b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 5,
    fontWeight: '500',
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
    padding: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 22,
    color: '#6d28d9',
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
    marginTop: 6,
    marginBottom: 20,
    borderRadius: 14,
    backgroundColor: '#4f46e5',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    height: 56,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  securityIcon: {
    marginRight: 6,
  },
  securityText: {
    fontSize: 13,
    color: '#6b7280',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    color: '#6b7280',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '48%',
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  register: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  registerText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default Login;
