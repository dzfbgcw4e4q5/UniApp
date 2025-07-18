import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import { IP } from '../ip';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const Registration = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [branch, setBranch] = useState('CSE');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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

  const branches = [
    { label: 'Computer Science & Engineering', value: 'CSE' },
    { label: 'Information Science & Engineering', value: 'ISE' },
    { label: 'Electronics & Communication Engineering', value: 'ECE' },
    { label: 'Civil Engineering', value: 'CIVIL' },
    { label: 'Mechanical Engineering', value: 'MECH' },
    { label: 'Electrical Engineering', value: 'EEE' },
    { label: 'Biotechnology', value: 'BT' },
  ];

  const handleRegister = async () => {
    try {
      setIsLoading(true);
      if (!name || !email || !password) {
        Alert.alert('Registration Incomplete', 'Please complete all required fields to proceed with university registration.');
        setIsLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Invalid Email Format', 'Please enter a valid university email address (e.g., name@university.edu).');
        setIsLoading(false);
        return;
      }

      const endpoint =
        role === 'admin'
          ? 'admin/register'
          : role === 'faculty'
          ? 'faculty/register'
          : 'student/register';

      const response = await axios.post(`http://${IP}:3000/api/${endpoint}`, {
        name,
        email,
        password,
        branch: role === 'admin' ? null : branch,
      });

      if (response.data.success) {
        Alert.alert('Registration Successful', 'Your university account has been created. You can now log in to access your academic portal.', [
          { text: 'Proceed to Login', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || 'Registration failed';
        if (errorMessage.includes('Email already registered')) {
          Alert.alert(
            'Email Already Registered', 
            'This email address is already registered. Please use a different email or try logging in instead.',
            [
              { text: 'Try Different Email', style: 'default' },
              { text: 'Go to Login', onPress: () => navigation.navigate('Login') }
            ]
          );
        } else {
          Alert.alert('Registration Error', `Unable to complete registration: ${errorMessage}`);
        }
      } else if (error.response?.status === 500) {
        Alert.alert(
          'Server Error', 
          'The registration service is temporarily unavailable. Please try again later or contact IT support.'
        );
      } else if (error.message && error.message.includes('Network Error')) {
        Alert.alert(
          'Connection Error', 
          'Unable to connect to the university server. Please check your internet connection and try again.'
        );
      } else {
        const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
        Alert.alert('Registration Error', `Unable to complete university registration: ${errorMessage}. Please contact the university IT support if this issue persists.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0891b2', '#06b6d4', '#22d3ee']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0891b2" />
        {/* Set the title for the screen - visible in some contexts */}
        <Text style={{ height: 0, width: 0, opacity: 0 }}>Campus Connect - University Registration</Text>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <Animated.View 
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#0891b2" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Create Account</Text>
                <Text style={styles.headerSubtitle}>Join the university portal</Text>
              </View>
            </Animated.View>

            {/* Form Section */}
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
                <Text style={styles.formTitle}>Personal Information</Text>
                <Text style={styles.formSubtitle}>Please provide your details</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your legal full name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="your.name@university.edu"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9ca3af"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a secure password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    placeholderTextColor="#9ca3af"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    style={styles.visibilityToggle}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHint}>Password must be at least 8 characters</Text>
              </View>

              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Academic Information</Text>
                <Text style={styles.formSubtitle}>Select your role and department</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>University Role</Text>
                <View style={styles.pickerWithIcon}>
                  <Ionicons name="school-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={role}
                      style={styles.picker}
                      onValueChange={(itemValue) => {
                        setRole(itemValue);
                        if (itemValue === 'admin') {
                          setBranch('');
                        } else {
                          setBranch('CSE');
                        }
                      }}
                      enabled={!isLoading}
                    >
                      <Picker.Item label="Student" value="student" />
                      <Picker.Item label="Faculty Member" value="faculty" />
                      <Picker.Item label="Administrative Staff" value="admin" />
                    </Picker>
                  </View>
                </View>
              </View>

              {role !== 'admin' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Academic Department</Text>
                  <View style={styles.pickerWithIcon}>
                    <Ionicons name="git-branch-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={branch}
                        style={styles.picker}
                        onValueChange={(itemValue) => setBranch(itemValue)}
                        enabled={!isLoading}
                      >
                        {branches.map((b) => (
                          <Picker.Item key={b.value} label={b.label} value={b.value} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.termsContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#0891b2" style={styles.termsIcon} />
                <Text style={styles.termsText}>
                  By registering, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Create Account</Text>
                    <Ionicons name="arrow-forward-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social login options removed as per request */}

              <View style={styles.loginRedirectContainer}>
                <Text style={styles.loginRedirectText}>Already have an account? </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Login')}
                  disabled={isLoading}
                >
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.footer}>
                <Text style={styles.footerText}>© 2023 Campus Connect</Text>
                <Text style={styles.footerText}>v1.0.0</Text>
              </View>
            </Animated.View>
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
    paddingBottom: 30,
    paddingTop: 20,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 15,
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    alignSelf: 'flex-start',
    shadowColor: '#0e7490',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  headerContent: {
    marginBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: 30,
    paddingTop: 35,
    paddingBottom: 30,
    marginHorizontal: 20,
    shadowColor: '#0e7490',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 20,
  },
  formHeader: {
    marginBottom: 20,
    marginTop: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e1b4b',
    marginBottom: 5,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
    paddingLeft: 2,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    height: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  visibilityToggle: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
  },
  passwordHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    paddingLeft: 2,
  },
  pickerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    height: Platform.OS === 'ios' ? 58 : 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerWrapper: {
    flex: 1,
    height: '100%',
  },
  picker: {
    height: Platform.OS === 'android' ? 58 : 150,
    width: '100%',
    color: '#1f2937',
    backgroundColor: 'transparent',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    marginTop: 5,
    paddingHorizontal: 5,
  },
  termsIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  termsText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: '#0891b2',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#0891b2',
    borderRadius: 14,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#67e8f9',
    opacity: 0.8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 10,
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
  loginRedirectContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 10,
  },
  loginRedirectText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    color: '#0891b2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default Registration;