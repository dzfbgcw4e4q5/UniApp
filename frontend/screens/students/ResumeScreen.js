import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ToastAndroid,
  Modal,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';

import axios from 'axios';
import { IP } from '../../ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import Constants from 'expo-constants';



const  ResumeScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [resumeExists, setResumeExists] = useState(false);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [studentInfo, setStudentInfo] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [resume, setResume] = useState({
    objective: '',
    education: '',
    skills: '',
    languages: '',
    experience: '',
    projects: '',
    certifications: '',
    achievements: '',
    reference_info: '',
    additional_info: ''
  });

  useEffect(() => {
    testResumeEndpoint();
  }, []);
  
  const testResumeEndpoint = async () => {
    try {
      // Test the resume-specific endpoint directly
      console.log(`Testing resume endpoint: http://${IP}:3000/api/student/resume-test`);
      const resumeResponse = await axios.get(`http://${IP}:3000/api/student/resume-test`);
      console.log('Resume test response:', resumeResponse.data);
      
      if (resumeResponse.data && resumeResponse.data.message) {
        ToastAndroid.show('Resume API connection successful!', ToastAndroid.SHORT);
        console.log('Resume test endpoint working, now fetching resume');
        fetchResume();
      }
    } catch (error) {
      console.error('Error testing resume endpoint:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
        Alert.alert('API Error', `Resume test endpoint failed: ${error.response.status}`);
      } else if (error.request) {
        console.error('Request error - no response received');
        Alert.alert('Network Error', 'Could not connect to the server. Please check your internet connection and server status.');
      } else {
        console.error('Error setting up request:', error.message);
        Alert.alert('Error', `Request setup failed: ${error.message}`);
      }
    }
  };

  const fetchResume = async () => {
    try {
      setIsLoading(true);
      ToastAndroid.show('Fetching resume...', ToastAndroid.SHORT);
      
      // Get the token
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        Alert.alert('Authentication Error', 'No authentication token found. Please login again.');
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching resume from: http://${IP}:3000/api/student/resume`);
      console.log(`Token available: ${token ? 'Yes' : 'No'}`);
      
      // Try the authenticated resume endpoint
      try {
        const response = await axios.get(`http://${IP}:3000/api/student/resume`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10 second timeout
        });
        
        console.log('Resume fetch response:', response.status);
        
        if (response.data && !response.data.error) {
          console.log('Resume data received');
          setResumeExists(true);
          
          // Store student info if available
          if (response.data.studentInfo) {
            setStudentInfo(response.data.studentInfo);
          }
          
          setResume({
            objective: response.data.objective || '',
            education: response.data.education || '',
            skills: response.data.skills || '',
            languages: response.data.languages || '',
            experience: response.data.experience || '',
            projects: response.data.projects || '',
            certifications: response.data.certifications || '',
            achievements: response.data.achievements || '',
            reference_info: response.data.reference_info || '',
            additional_info: response.data.additional_info || ''
          });
          ToastAndroid.show('Resume loaded successfully!', ToastAndroid.SHORT);
        }
      } catch (resumeError) {
        console.error('Error fetching resume:', resumeError);
        
        // If it's a 404, it means the resume doesn't exist yet, which is fine
        if (resumeError.response && resumeError.response.status === 404) {
          console.log('No resume exists yet, user can create one');
          setResumeExists(false);
          ToastAndroid.show('Create your first resume!', ToastAndroid.SHORT);
        } else if (resumeError.response) {
          console.error('Response error:', resumeError.response.status, resumeError.response.data);
          Alert.alert('Error', `Failed to fetch resume data: ${resumeError.response.status}`);
        } else if (resumeError.request) {
          console.error('Request error - no response received');
          Alert.alert('Network Error', 'Could not connect to the resume API. Please check your internet connection.');
        } else {
          console.error('Error setting up request:', resumeError.message);
          Alert.alert('Error', `Request setup failed: ${resumeError.message}`);
        }
      }
    } catch (error) {
      console.error('Unexpected error in fetchResume:', error);
      Alert.alert('Error', 'An unexpected error occurred while fetching your resume.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResume = async (showAlerts = true) => {
    try {
      setIsSaving(true);
      if (showAlerts) {
        Platform.OS === 'android' && ToastAndroid.show('Saving resume...', ToastAndroid.SHORT);
      }
      
      // Get the token
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        if (showAlerts) {
          Alert.alert('Authentication Error', 'Please login again.');
        }
        return false;
      }
      
      // Try to save the resume
      const response = await axios.post(
        `http://${IP}:3000/api/student/resume`,
        resume,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10 second timeout
        }
      );
      
      if (response.data && response.data.success) {
        setResumeExists(true);
        
        if (showAlerts) {
          Alert.alert(
            'Success',
            resumeExists ? 'Resume updated successfully' : 'Resume created successfully'
          );
          Platform.OS === 'android' && ToastAndroid.show('Resume saved!', ToastAndroid.SHORT);
        }
        
        return true;
      } else {
        if (showAlerts) {
          Alert.alert('Warning', 'Resume may not have been saved properly');
        }
        return false;
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      
      if (showAlerts) {
        if (error.response) {
          Alert.alert('Error', `Failed to save resume: ${error.response.data?.error || error.response.status}`);
        } else if (error.request) {
          Alert.alert('Network Error', 'Could not connect to the server. Please check your internet connection.');
        } else {
          Alert.alert('Error', `Request failed: ${error.message}`);
        }
      }
      
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setResume(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Simplified one-click resume generation function
  const handleQuickResume = async () => {
    try {
      setIsLoading(true);
      
      // First save the current resume data
      const saveSuccess = await handleSaveResume(false); // Pass false to avoid showing success alert
      
      if (!saveSuccess) {
        // If save failed but we're not showing alerts, show one now
        Alert.alert('Error', 'Failed to save resume data. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Get the token
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Authentication Error', 'Please login again.');
        return;
      }
      
      // First get a share link
      const shareResponse = await axios.get(`http://${IP}:3000/api/student/resume/share`, {
        headers: { 
          Authorization: `Bearer ${token}`
        },
        timeout: 10000
      });
      
      if (!shareResponse.data || !shareResponse.data.success) {
        throw new Error('Failed to generate share link');
      }
      
      // Create PDF URL with selected template
      const shareId = shareResponse.data.shareUrl.split('/').pop();
      const pdfUrl = `http://${IP}:3000/api/student/resume/public/${shareId}?format=pdf&template=${selectedTemplate}&layout=two-column`;
      
      // Create a response object similar to what the API would return
      const response = {
        data: {
          success: true,
          pdfUrl: pdfUrl
        }
      };
      
      if (response.data && response.data.success) {
        // Set the PDF URL directly
        setPdfUrl(response.data.pdfUrl);
        setSelectedTemplate('classic');
        
        // Show the PDF modal
        setPdfModalVisible(true);
        Platform.OS === 'android' && ToastAndroid.show('Resume ready!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Failed to generate resume. Please try again.');
      }
    } catch (error) {
      console.error('Error generating quick resume:', error);
      Alert.alert('Error', 'Failed to generate resume. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Advanced PDF generation with template selection
  const generatePDF = async (template = 'classic') => {
    if (!studentInfo?.profileApproved) {
      Alert.alert('Not Approved', 'Your resume must be approved by the admin before you can download it.');
      return;
    }
    try {
      setIsLoading(true);
      setSelectedTemplate(template);
      
      // Get the token
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Authentication Error', 'Please login again.');
        return;
      }
      
      // First get a share link
      const shareResponse = await axios.get(`http://${IP}:3000/api/student/resume/share`, {
        headers: { 
          Authorization: `Bearer ${token}`
        },
        timeout: 10000
      });
      
      if (!shareResponse.data || !shareResponse.data.success) {
        throw new Error('Failed to generate share link');
      }
      
      // Create PDF URL with selected template
      const shareId = shareResponse.data.shareUrl.split('/').pop();
      const pdfUrl = `http://${IP}:3000/api/student/resume/public/${shareId}?format=pdf&template=${template}&layout=two-column`;
      
      // Create a response object similar to what the API would return
      const response = {
        data: {
          success: true,
          pdfUrl: pdfUrl
        }
      };
      
      if (response.data && response.data.success) {
        // Set the PDF URL directly
        setPdfUrl(response.data.pdfUrl);
        
        // Close template modal and show PDF modal
        setTemplateModalVisible(false);
        setPdfModalVisible(true);
        Platform.OS === 'android' && ToastAndroid.show('Resume ready!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Failed to generate resume with selected template.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  


  // Enhanced function to view PDF with better UX
  const handleViewPdfInApp = async () => {
    if (!pdfUrl) {
      Alert.alert('Error', 'PDF URL not available. Please generate the resume first.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Show enhanced loading feedback
      Platform.OS === 'android' && ToastAndroid.show('Preparing PDF preview...', ToastAndroid.SHORT);
      
      // Download the PDF to a temporary location
      const fileName = `resume_${selectedTemplate}_${Date.now()}.pdf`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      
      console.log(`Downloading PDF for enhanced preview: ${pdfUrl}`);
      
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);
      
      if (downloadResult.status === 200) {
        // Close the modal first for better UX
        setPdfModalVisible(false);
        
        // Small delay to ensure smooth transition
        setTimeout(async () => {
          try {
            // Use Expo Print with enhanced options for better preview
            await Print.printAsync({
              uri: downloadResult.uri,
              printerUrl: undefined,
              orientation: Print.Orientation.portrait,
              useMarkupFormatter: false,
            });
            
            Platform.OS === 'android' && ToastAndroid.show('PDF preview opened!', ToastAndroid.SHORT);
            
          } catch (printError) {
            console.error('Print preview error:', printError);
            Alert.alert(
              'Preview Error',
              'Could not open PDF preview. The file has been downloaded successfully.',
              [{ text: 'OK' }]
            );
          }
        }, 300);
        
        // Clean up the temporary file after a longer delay
        setTimeout(async () => {
          try {
            await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
            console.log('Temporary PDF file cleaned up');
          } catch (cleanupError) {
            console.log('Cleanup error (non-critical):', cleanupError);
          }
        }, 30000); // 30 seconds delay for cleanup
        
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
      
    } catch (error) {
      console.error('Error viewing PDF in app:', error);
      Alert.alert(
        'Preview Error', 
        'Failed to open PDF preview. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => handleViewPdfInApp() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to share PDF resume using Expo Sharing
  const handleShareResume = async () => {
    if (!pdfUrl) {
      Alert.alert('Error', 'PDF URL not available. Please generate the resume first.');
      return;
    }
    if (!studentInfo?.profileApproved) {
      Alert.alert('Not Approved', 'Your resume must be approved by the admin before you can share or download it.');
      return;
    }
    try {
      setIsLoading(true);
      Platform.OS === 'android' && ToastAndroid.show('Preparing to share...', ToastAndroid.SHORT);
      
      // Check if sharing is available on the device
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        return;
      }
      
      // Get student name for the filename or use a default
      const fileName = studentInfo?.name 
        ? `${studentInfo.name.replace(/\s+/g, '_')}_Resume.pdf` 
        : `Resume_${Date.now()}.pdf`;
      
      console.log(`Preparing to share resume: ${fileName}`);
      console.log(`PDF URL: ${pdfUrl}`);
      
      // Download the PDF to a temporary location for sharing
      const fileUri = FileSystem.cacheDirectory + fileName;
      
      // Add quality parameters to the PDF URL for better quality
      const qualityPdfUrl = `${pdfUrl}${pdfUrl.includes('?') ? '&' : '?'}quality=high&dpi=300&timestamp=${Date.now()}`;
      
      // Download the file with proper headers for PDF
      const downloadResult = await FileSystem.downloadAsync(
        qualityPdfUrl,
        fileUri,
        {
          headers: {
            'Accept': 'application/pdf',
            'Content-Type': 'application/pdf',
            'User-Agent': 'Mozilla/5.0 (Android; Mobile; rv:40.0) Gecko/40.0 Firefox/40.0'
          }
        }
      );
      
      if (downloadResult.status === 200) {
        // Verify the file exists and has content
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        console.log('Downloaded file info for sharing:', fileInfo);
        
        if (fileInfo.exists && fileInfo.size > 0) {
          // Share the PDF file using Expo Sharing
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Resume PDF',
            UTI: 'com.adobe.pdf'
          });
          
          Platform.OS === 'android' && ToastAndroid.show('Resume shared successfully!', ToastAndroid.SHORT);
          
          // Clean up the temporary file after a delay
          setTimeout(async () => {
            try {
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
              console.log('Temporary share file cleaned up');
            } catch (cleanupError) {
              console.log('Cleanup error (non-critical):', cleanupError);
            }
          }, 10000); // 10 seconds delay to ensure sharing is complete
          
        } else {
          Alert.alert('Share Error', 'The PDF file appears to be empty or corrupted.');
        }
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
      
    } catch (error) {
      console.error('Error sharing resume:', error);
      Alert.alert(
        'Share Error', 
        'Failed to share resume. Please try again.',
        [
          { text: 'OK' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading resume data...</Text>
      </View>
    );
  }

  // Enhanced Template Selection Modal
  const TemplateSelectionModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={templateModalVisible}
      onRequestClose={() => setTemplateModalVisible(false)}
    >
      <SafeAreaView style={styles.enhancedModalContainer}>
        <View style={styles.enhancedModalHeader}>
          <Text style={styles.enhancedModalHeaderText}>Choose Your Template</Text>
          <TouchableOpacity
            style={styles.enhancedCloseButton}
            onPress={() => setTemplateModalVisible(false)}
          >
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.enhancedTemplateScrollView}>
          <View style={styles.enhancedInstructionCard}>
            <MaterialIcons name="style" size={28} color="#3b82f6" />
            <Text style={styles.enhancedInstructionTitle}>
              Select a Template for Your Resume
            </Text>
            <Text style={styles.enhancedInstructionText}>
              Choose a template to generate your resume PDF. After selecting, you'll be able to view or download it.
            </Text>
          </View>
          
          <View style={styles.enhancedTemplateGrid}>
            {/* Modern Template */}
            <TouchableOpacity 
              style={[
                styles.enhancedTemplateCard, 
                selectedTemplate === 'modern' && styles.enhancedSelectedCard
              ]}
              onPress={() => generatePDF('modern')}
              activeOpacity={0.7}
            >
              <View style={styles.enhancedTemplateHeader}>
                <Text style={styles.enhancedTemplateBadge}>Popular</Text>
              </View>
              <View style={styles.enhancedTemplateContent}>
                <View style={styles.enhancedTemplatePreview}>
                  <MaterialIcons name="description" size={40} color="#3b82f6" />
                  <View style={styles.enhancedPreviewLines}>
                    <View style={styles.enhancedPreviewLine} />
                    <View style={[styles.enhancedPreviewLine, { width: '70%' }]} />
                    <View style={[styles.enhancedPreviewLine, { width: '85%' }]} />
                  </View>
                </View>
                <View style={styles.enhancedTemplateTextContainer}>
                  <Text style={styles.enhancedTemplateName}>Modern</Text>
                  <Text style={styles.enhancedTemplateDescription}>Clean and professional design with a modern touch</Text>
                </View>
                
                {selectedTemplate === 'modern' && (
                  <View style={styles.enhancedSelectedIndicator}>
                    <MaterialIcons name="check-circle" size={24} color="#3b82f6" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Classic Template */}
            <TouchableOpacity 
              style={[
                styles.enhancedTemplateCard, 
                selectedTemplate === 'classic' && styles.enhancedSelectedCard
              ]}
              onPress={() => generatePDF('classic')}
              activeOpacity={0.7}
            >
              <View style={styles.enhancedTemplateHeader}>
                <Text style={styles.enhancedTemplateBadge}>Traditional</Text>
              </View>
              <View style={styles.enhancedTemplateContent}>
                <View style={styles.enhancedTemplatePreview}>
                  <MaterialIcons name="description" size={40} color="#4b5563" />
                  <View style={styles.enhancedPreviewLines}>
                    <View style={styles.enhancedPreviewLine} />
                    <View style={[styles.enhancedPreviewLine, { width: '60%' }]} />
                    <View style={[styles.enhancedPreviewLine, { width: '75%' }]} />
                  </View>
                </View>
                <View style={styles.enhancedTemplateTextContainer}>
                  <Text style={styles.enhancedTemplateName}>Classic</Text>
                  <Text style={styles.enhancedTemplateDescription}>Traditional resume format, perfect for formal applications</Text>
                </View>
                
                {selectedTemplate === 'classic' && (
                  <View style={styles.enhancedSelectedIndicator}>
                    <MaterialIcons name="check-circle" size={24} color="#4b5563" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Executive Template */}
            <TouchableOpacity 
              style={[
                styles.enhancedTemplateCard, 
                selectedTemplate === 'executive' && styles.enhancedSelectedCard
              ]}
              onPress={() => generatePDF('executive')}
              activeOpacity={0.7}
            >
              <View style={styles.enhancedTemplateHeader}>
                <Text style={styles.enhancedTemplateBadge}>Executive</Text>
              </View>
              <View style={styles.enhancedTemplateContent}>
                <View style={styles.enhancedTemplatePreview}>
                  <MaterialIcons name="description" size={40} color="#1e40af" />
                  <View style={styles.enhancedPreviewLines}>
                    <View style={styles.enhancedPreviewLine} />
                    <View style={[styles.enhancedPreviewLine, { width: '75%' }]} />
                    <View style={[styles.enhancedPreviewLine, { width: '60%' }]} />
                  </View>
                </View>
                <View style={styles.enhancedTemplateTextContainer}>
                  <Text style={styles.enhancedTemplateName}>Executive</Text>
                  <Text style={styles.enhancedTemplateDescription}>Professional template for senior positions</Text>
                </View>
                
                {selectedTemplate === 'executive' && (
                  <View style={styles.enhancedSelectedIndicator}>
                    <MaterialIcons name="check-circle" size={24} color="#1e40af" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Minimalist Template */}
            <TouchableOpacity 
              style={[
                styles.enhancedTemplateCard, 
                selectedTemplate === 'minimalist' && styles.enhancedSelectedCard
              ]}
              onPress={() => generatePDF('minimalist')}
              activeOpacity={0.7}
            >
              <View style={styles.enhancedTemplateHeader}>
                <Text style={styles.enhancedTemplateBadge}>Clean</Text>
              </View>
              <View style={styles.enhancedTemplateContent}>
                <View style={styles.enhancedTemplatePreview}>
                  <MaterialIcons name="description" size={40} color="#10b981" />
                  <View style={styles.enhancedPreviewLines}>
                    <View style={styles.enhancedPreviewLine} />
                    <View style={[styles.enhancedPreviewLine, { width: '50%' }]} />
                    <View style={[styles.enhancedPreviewLine, { width: '90%' }]} />
                  </View>
                </View>
                <View style={styles.enhancedTemplateTextContainer}>
                  <Text style={styles.enhancedTemplateName}>Minimalist</Text>
                  <Text style={styles.enhancedTemplateDescription}>Simple and elegant design with focus on content</Text>
                </View>
                
                {selectedTemplate === 'minimalist' && (
                  <View style={styles.enhancedSelectedIndicator}>
                    <MaterialIcons name="check-circle" size={24} color="#10b981" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Creative Template */}
            <TouchableOpacity 
              style={[
                styles.enhancedTemplateCard, 
                selectedTemplate === 'creative' && styles.enhancedSelectedCard
              ]}
              onPress={() => generatePDF('creative')}
              activeOpacity={0.7}
            >
              <View style={styles.enhancedTemplateHeader}>
                <Text style={styles.enhancedTemplateBadge}>Creative</Text>
              </View>
              <View style={styles.enhancedTemplateContent}>
                <View style={styles.enhancedTemplatePreview}>
                  <MaterialIcons name="description" size={40} color="#8b5cf6" />
                  <View style={styles.enhancedPreviewLines}>
                    <View style={styles.enhancedPreviewLine} />
                    <View style={[styles.enhancedPreviewLine, { width: '80%' }]} />
                    <View style={[styles.enhancedPreviewLine, { width: '65%' }]} />
                  </View>
                </View>
                <View style={styles.enhancedTemplateTextContainer}>
                  <Text style={styles.enhancedTemplateName}>Creative</Text>
                  <Text style={styles.enhancedTemplateDescription}>Stand out with a unique design for creative fields</Text>
                </View>
                
                {selectedTemplate === 'creative' && (
                  <View style={styles.enhancedSelectedIndicator}>
                    <MaterialIcons name="check-circle" size={24} color="#8b5cf6" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Professional Template */}
            <TouchableOpacity 
              style={[
                styles.enhancedTemplateCard, 
                selectedTemplate === 'professional' && styles.enhancedSelectedCard
              ]}
              onPress={() => generatePDF('professional')}
              activeOpacity={0.7}
            >
              <View style={styles.enhancedTemplateHeader}>
                <Text style={styles.enhancedTemplateBadge}>Pro</Text>
              </View>
              <View style={styles.enhancedTemplateContent}>
                <View style={styles.enhancedTemplatePreview}>
                  <MaterialIcons name="description" size={40} color="#374151" />
                  <View style={styles.enhancedPreviewLines}>
                    <View style={styles.enhancedPreviewLine} />
                    <View style={[styles.enhancedPreviewLine, { width: '75%' }]} />
                    <View style={[styles.enhancedPreviewLine, { width: '60%' }]} />
                  </View>
                </View>
                <View style={styles.enhancedTemplateTextContainer}>
                  <Text style={styles.enhancedTemplateName}>Professional</Text>
                  <Text style={styles.enhancedTemplateDescription}>Modern with dark gray and orange accents</Text>
                </View>
                
                {selectedTemplate === 'professional' && (
                  <View style={styles.enhancedSelectedIndicator}>
                    <MaterialIcons name="check-circle" size={24} color="#374151" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Academic Template */}
            <TouchableOpacity 
              style={[
                styles.enhancedTemplateCard, 
                selectedTemplate === 'academic' && styles.enhancedSelectedCard
              ]}
              onPress={() => generatePDF('academic')}
              activeOpacity={0.7}
            >
              <View style={styles.enhancedTemplateHeader}>
                <Text style={styles.enhancedTemplateBadge}>Academic</Text>
              </View>
              <View style={styles.enhancedTemplateContent}>
                <View style={styles.enhancedTemplatePreview}>
                  <MaterialIcons name="description" size={40} color="#7f1d1d" />
                  <View style={styles.enhancedPreviewLines}>
                    <View style={styles.enhancedPreviewLine} />
                    <View style={[styles.enhancedPreviewLine, { width: '80%' }]} />
                    <View style={[styles.enhancedPreviewLine, { width: '70%' }]} />
                  </View>
                </View>
                <View style={styles.enhancedTemplateTextContainer}>
                  <Text style={styles.enhancedTemplateName}>Academic</Text>
                  <Text style={styles.enhancedTemplateDescription}>Formal design with maroon accents</Text>
                </View>
                
                {selectedTemplate === 'academic' && (
                  <View style={styles.enhancedSelectedIndicator}>
                    <MaterialIcons name="check-circle" size={24} color="#7f1d1d" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Elegant Template */}
            <TouchableOpacity 
              style={[
                styles.enhancedTemplateCard, 
                selectedTemplate === 'elegant' && styles.enhancedSelectedCard
              ]}
              onPress={() => generatePDF('elegant')}
              activeOpacity={0.7}
            >
              <View style={styles.enhancedTemplateHeader}>
                <Text style={styles.enhancedTemplateBadge}>Elegant</Text>
              </View>
              <View style={styles.enhancedTemplateContent}>
                <View style={styles.enhancedTemplatePreview}>
                  <MaterialIcons name="description" size={40} color="#ca8a04" />
                  <View style={styles.enhancedPreviewLines}>
                    <View style={styles.enhancedPreviewLine} />
                    <View style={[styles.enhancedPreviewLine, { width: '65%' }]} />
                    <View style={[styles.enhancedPreviewLine, { width: '90%' }]} />
                  </View>
                </View>
                <View style={styles.enhancedTemplateTextContainer}>
                  <Text style={styles.enhancedTemplateName}>Elegant</Text>
                  <Text style={styles.enhancedTemplateDescription}>Light blue with gold accents</Text>
                </View>
                
                {selectedTemplate === 'elegant' && (
                  <View style={styles.enhancedSelectedIndicator}>
                    <MaterialIcons name="check-circle" size={24} color="#ca8a04" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Clean PDF Success Modal
  const PDFResumeModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={pdfModalVisible}
      onRequestClose={() => setPdfModalVisible(false)}
    >
      <View style={styles.cleanPdfOverlay}>
        <View style={styles.cleanPdfContainer}>
          <View style={styles.cleanPdfHeader}>
            <View style={styles.cleanSuccessIcon}>
              <MaterialIcons name="check" size={48} color="#10b981" />
            </View>
            <Text style={styles.cleanPdfTitle}>Resume Ready!</Text>
            <Text style={styles.cleanPdfSubtitle}>
              Your {selectedTemplate} template resume has been generated
            </Text>
          </View>
          
          <View style={styles.cleanPdfActions}>
            <TouchableOpacity
              style={styles.cleanPdfButton}
              onPress={() => {
                if (!studentInfo?.profileApproved) {
                  Alert.alert('Not Approved', 'Your resume must be approved by the admin before you can download or view it.');
                  return;
                }
                try {
                  const viewUrl = `${pdfUrl}${pdfUrl.includes('?') ? '&' : '?'}inline=true&timestamp=${Date.now()}`;
                  Linking.openURL(viewUrl);
                  setPdfModalVisible(false);
                  Platform.OS === 'android' && ToastAndroid.show('Opening in browser', ToastAndroid.SHORT);
                } catch (error) {
                  Alert.alert('Error', 'Could not open browser. Please try again.');
                }
              } }
              activeOpacity={0.8}
            >
              <MaterialIcons name="visibility" size={20} color="#ffffff" />
              <Text style={styles.cleanPdfButtonText}>View Resume</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.cleanPdfButton, styles.cleanPdfSecondaryButton]}
              onPress={() => {
                try {
                  const downloadUrl = `${pdfUrl}${pdfUrl.includes('?') ? '&' : '?'}download=true&timestamp=${Date.now()}`;
                  Linking.openURL(downloadUrl);
                  setPdfModalVisible(false);
                  Platform.OS === 'android' && ToastAndroid.show('Downloading resume...', ToastAndroid.SHORT);
                } catch (error) {
                  Alert.alert('Error', 'Could not download. Please try again.');
                }
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="download" size={20} color="#3b82f6" />
              <Text style={[styles.cleanPdfButtonText, {color: '#3b82f6'}]}>Download</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.cleanPdfCloseButton}
            onPress={() => setPdfModalVisible(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.cleanPdfCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );





  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header removed as requested */}

      {/* Main Scrollable Content */}
      <ScrollView 
        style={styles.modernMainContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.modernScrollContent}
      >





      <View style={styles.modernFormContainer}>
        
        {/* Personal Information Section */}
        <View style={styles.modernFormSection}>
          <View style={styles.modernFormHeader}>
            <View style={[styles.modernFormIconContainer, {backgroundColor: '#dbeafe'}]}>
              <MaterialIcons name="person" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.modernFormTitle}>Career Objective</Text>
          </View>
          <TextInput
            style={styles.modernTextArea}
            placeholder="Write a compelling career objective that highlights your goals and aspirations..."
            placeholderTextColor="#94a3b8"
            value={resume.objective}
            onChangeText={(text) => handleInputChange('objective', text)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Education Section */}
        <View style={styles.modernFormSection}>
          <View style={styles.modernFormHeader}>
            <View style={[styles.modernFormIconContainer, {backgroundColor: '#f3e8ff'}]}>
              <MaterialIcons name="school" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.modernFormTitle}>Education</Text>
          </View>
          <TextInput
            style={styles.modernTextArea}
            placeholder="List your educational qualifications, degrees, institutions, and graduation years..."
            placeholderTextColor="#94a3b8"
            value={resume.education}
            onChangeText={(text) => handleInputChange('education', text)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Skills Section */}
        <View style={styles.modernFormSection}>
          <View style={styles.modernFormHeader}>
            <View style={[styles.modernFormIconContainer, {backgroundColor: '#dcfce7'}]}>
              <MaterialIcons name="build" size={20} color="#10b981" />
            </View>
            <Text style={styles.modernFormTitle}>Skills & Expertise</Text>
          </View>
          <TextInput
            style={styles.modernTextArea}
            placeholder="List your technical skills, programming languages, tools, and competencies..."
            placeholderTextColor="#94a3b8"
            value={resume.skills}
            onChangeText={(text) => handleInputChange('skills', text)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Experience Section */}
        <View style={styles.modernFormSection}>
          <View style={styles.modernFormHeader}>
            <View style={[styles.modernFormIconContainer, {backgroundColor: '#fef3c7'}]}>
              <MaterialIcons name="work" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.modernFormTitle}>Work Experience</Text>
          </View>
          <TextInput
            style={styles.modernTextArea}
            placeholder="Describe your work experience, internships, job roles, and responsibilities..."
            placeholderTextColor="#94a3b8"
            value={resume.experience}
            onChangeText={(text) => handleInputChange('experience', text)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Projects Section */}
        <View style={styles.modernFormSection}>
          <View style={styles.modernFormHeader}>
            <View style={[styles.modernFormIconContainer, {backgroundColor: '#fecaca'}]}>
              <MaterialIcons name="code" size={20} color="#ef4444" />
            </View>
            <Text style={styles.modernFormTitle}>Projects</Text>
          </View>
          <TextInput
            style={styles.modernTextArea}
            placeholder="Showcase your projects, including technologies used and key achievements..."
            placeholderTextColor="#94a3b8"
            value={resume.projects}
            onChangeText={(text) => handleInputChange('projects', text)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Languages Section */}
        <View style={styles.modernFormSection}>
          <View style={styles.modernFormHeader}>
            <View style={[styles.modernFormIconContainer, {backgroundColor: '#e0e7ff'}]}>
              <MaterialIcons name="language" size={20} color="#6366f1" />
            </View>
            <Text style={styles.modernFormTitle}>Languages</Text>
          </View>
          <TextInput
            style={styles.modernTextInput}
            placeholder="List languages you speak and your proficiency level..."
            placeholderTextColor="#94a3b8"
            value={resume.languages}
            onChangeText={(text) => handleInputChange('languages', text)}
          />
        </View>

        {/* Certifications Section */}
        <View style={styles.modernFormSection}>
          <View style={styles.modernFormHeader}>
            <View style={[styles.modernFormIconContainer, {backgroundColor: '#fef3c7'}]}>
              <MaterialIcons name="verified" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.modernFormTitle}>Certifications</Text>
          </View>
          <TextInput
            style={styles.modernTextArea}
            placeholder="List your professional certifications, licenses, and credentials..."
            placeholderTextColor="#94a3b8"
            value={resume.certifications}
            onChangeText={(text) => handleInputChange('certifications', text)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Achievements Section */}
        <View style={styles.modernFormSection}>
          <View style={styles.modernFormHeader}>
            <View style={[styles.modernFormIconContainer, {backgroundColor: '#dcfce7'}]}>
              <MaterialIcons name="emoji-events" size={20} color="#10b981" />
            </View>
            <Text style={styles.modernFormTitle}>Achievements</Text>
          </View>
          <TextInput
            style={styles.modernTextArea}
            placeholder="Highlight your awards, recognitions, and notable achievements..."
            placeholderTextColor="#94a3b8"
            value={resume.achievements}
            onChangeText={(text) => handleInputChange('achievements', text)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* References Section */}
        <View style={styles.modernFormSection}>
          <View style={styles.modernFormHeader}>
            <View style={[styles.modernFormIconContainer, {backgroundColor: '#f3e8ff'}]}>
              <MaterialIcons name="contacts" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.modernFormTitle}>References</Text>
          </View>
          <TextInput
            style={styles.modernTextArea}
            placeholder="Provide professional references with contact information..."
            placeholderTextColor="#94a3b8"
            value={resume.references_info}
            onChangeText={(text) => handleInputChange('references_info', text)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Additional Information Section */}
        <View style={styles.modernFormSection}>
          <View style={styles.modernFormHeader}>
            <View style={[styles.modernFormIconContainer, {backgroundColor: '#dbeafe'}]}>
              <MaterialIcons name="info" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.modernFormTitle}>Additional Information</Text>
          </View>
          <TextInput
            style={styles.modernTextArea}
            placeholder="Add any other relevant information, hobbies, or interests..."
            placeholderTextColor="#94a3b8"
            value={resume.additional_info}
            onChangeText={(text) => handleInputChange('additional_info', text)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Modern Footer Actions - Enhanced UI */}
        <View style={styles.modernFooterActions}>
          <Text style={styles.actionSectionTitle}>Resume Actions</Text>
          
          <View style={styles.actionButtonsGrid}>
            {/* Save Resume Button */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleSaveResume(true)}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, styles.saveIconContainer]}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <MaterialIcons name="save" size={28} color="#ffffff" />
                )}
              </View>
              <Text style={styles.actionCardTitle}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
              <Text style={styles.actionCardDescription}>
                Save your resume data
              </Text>
            </TouchableOpacity>
            
            {/* Template Selection Button */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setTemplateModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, styles.templateIconContainer]}>
                <MaterialIcons name="palette" size={28} color="#ffffff" />
              </View>
              <Text style={styles.actionCardTitle}>
                Templates
              </Text>
              <Text style={styles.actionCardDescription}>
                Choose design styles
              </Text>
            </TouchableOpacity>
            
            {/* Generate PDF Button */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleQuickResume}
              disabled={isLoading || !resumeExists}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, styles.pdfIconContainer]}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <MaterialIcons name="picture-as-pdf" size={28} color="#ffffff" />
                )}
              </View>
              <Text style={styles.actionCardTitle}>
                {isLoading ? 'Generating...' : 'PDF'}
              </Text>
              <Text style={styles.actionCardDescription}>
                Create PDF document
              </Text>
            </TouchableOpacity>
            
            {/* Share Resume Button */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleShareResume}
              disabled={isLoading || !pdfUrl}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, styles.shareIconContainer]}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <MaterialIcons name="share" size={28} color="#ffffff" />
                )}
              </View>
              <Text style={styles.actionCardTitle}>
                Share
              </Text>
              <Text style={styles.actionCardDescription}>
                Share with others
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modernBottomSpacer} />
      </View>
      </ScrollView>

      {/* Modern Template Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={templateModalVisible}
        onRequestClose={() => setTemplateModalVisible(false)}
      >
        <View style={styles.enhancedModalContainer}>
          <View style={styles.enhancedPdfModalContent}>
            <View style={styles.modernModalHeader}>
              <Text style={styles.modernModalTitle}>Choose Template</Text>
              <TouchableOpacity
                style={styles.modernCloseButton}
                onPress={() => setTemplateModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modernTemplateScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modernTemplateGrid}>
                {[
                  { name: 'classic', color: '#4b5563', bgColor: '#f8fafc', description: 'Traditional format' },
                  { name: 'executive', color: '#1e40af', bgColor: '#dbeafe', description: 'Senior positions' },
                  { name: 'minimalist', color: '#10b981', bgColor: '#dcfce7', description: 'Simple and elegant' },
                  { name: 'creative', color: '#8b5cf6', bgColor: '#f3e8ff', description: 'Unique design' },

                  { name: 'professional', color: '#f97316', bgColor: '#374151', description: 'Dark gray & orange' },
                  { name: 'academic', color: '#7f1d1d', bgColor: '#fef2f2', description: 'Formal maroon' },
                  { name: 'elegant', color: '#ca8a04', bgColor: '#fefce8', description: 'Light blue & gold' }
                ].map((template) => (
                  <TouchableOpacity
                    key={template.name}
                    style={[
                      styles.modernTemplateCard,
                      selectedTemplate === template.name && styles.modernTemplateSelected
                    ]}
                    onPress={() => {
                      setSelectedTemplate(template.name);
                      setTemplateModalVisible(false);
                    }}
                  >
                    <View style={[
                      styles.modernTemplatePreview, 
                      { 
                        borderColor: template.color,
                        backgroundColor: template.name === 'professional' ? template.bgColor : '#ffffff'
                      }
                    ]}>
                      <View style={[
                        styles.modernTemplateHeader,
                        { backgroundColor: template.color }
                      ]} />
                      <MaterialIcons 
                        name="description" 
                        size={20} 
                        color={template.name === 'professional' ? template.color : template.color} 
                        style={{ marginTop: 8 }}
                      />
                    </View>
                    <Text style={styles.modernTemplateName}>
                      {template.name.charAt(0).toUpperCase() + template.name.slice(1)}
                    </Text>
                    <Text style={styles.modernTemplateDescription}>
                      {template.description}
                    </Text>
                    {selectedTemplate === template.name && (
                      <View style={[styles.modernSelectedBadge, { backgroundColor: template.color }]}>
                        <MaterialIcons name="check" size={16} color="#ffffff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modern PDF Success Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pdfModalVisible}
        onRequestClose={() => setPdfModalVisible(false)}
      >
        <View style={styles.enhancedPdfOverlay}>
          <View style={styles.enhancedPdfModalContent}>
            <View style={styles.enhancedPdfHeader}>
              <View style={styles.enhancedPdfIconContainer}>
                <MaterialIcons name="picture-as-pdf" size={64} color="#ef4444" />
              </View>
              <Text style={styles.enhancedPdfTitle}>Resume Generated!</Text>
              <Text style={styles.enhancedPdfSubtitle}>
                Your professional resume is ready to view and download
              </Text>
            </View>
            
            <View style={styles.enhancedPdfPreviewCard}>
              <View style={styles.enhancedPdfPreviewHeader}>
                <MaterialIcons name="description" size={24} color="#64748b" />
                <Text style={styles.enhancedPdfPreviewTitle}>Resume.pdf</Text>
              </View>
              <View style={styles.enhancedPdfPreviewBody}>
                <Text style={styles.enhancedPdfPreviewText}>
                  Template: {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)}
                </Text>
                <Text style={styles.enhancedPdfPreviewText}>
                  Generated: {new Date().toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.enhancedPdfActions}>
              <TouchableOpacity
                style={[styles.enhancedPdfButton, styles.enhancedViewButton]}
                onPress={handleViewPdfInApp}
                disabled={isLoading}
              >
                <View style={styles.enhancedButtonContent}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <MaterialIcons name="visibility" size={22} color="#ffffff" />
                  )}
                  <Text style={styles.enhancedPdfButtonText}>
                    {isLoading ? 'Opening Preview...' : 'View PDF Preview'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.enhancedPdfButton, styles.enhancedDownloadButton]}
                onPress={() => {
                  // Add download functionality here if needed
                  setPdfModalVisible(false);
                }}
              >
                
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.enhancedCloseButton}
              onPress={() => setPdfModalVisible(false)}
            >
              <Text style={styles.enhancedCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Safe Area (copied exactly from Support Tickets)
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Constants.statusBarHeight,
  },
  // Modern Safe Area and Container - Enhanced with Gradient Feel
  modernSafeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modernMainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 20, // Increased top padding for better spacing
  },
  modernScrollContent: {
    paddingBottom: 40, // Increased bottom padding for better spacing
  },
  
  // Modern Header Styles
  modernHeader: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modernHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernHeaderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modernHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  modernHeaderSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  modernHeaderAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modern Stats Card
  modernStatsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  modernStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernStatsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  modernStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  modernStatusActive: {
    backgroundColor: '#dcfce7',
  },
  modernStatusInactive: {
    backgroundColor: '#f1f5f9',
  },
  modernStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modernStatusActiveText: {
    color: '#10b981',
  },
  modernStatusInactiveText: {
    color: '#94a3b8',
  },
  modernStatsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  modernStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
  },
  modernStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  modernStatLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Modern Quick Actions
  modernQuickActions: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  modernSectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  modernActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modernActionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  modernActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  modernActionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Modern Form Container - Enhanced
  modernFormContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  modernFormSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    transform: [{ translateY: 0 }], // For animation potential
  },
  modernFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  modernFormIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modernFormTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    letterSpacing: -0.3,
  },
  modernTextInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  modernTextArea: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    fontWeight: '500',
    minHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  
  // Modern Footer Actions - Enhanced Styles with Glassmorphism
  modernFooterActions: {
    marginTop: 40,
    marginHorizontal: 16,
    marginBottom: 32,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.8)',
  },
  actionSectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 16,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    transform: [{ translateY: 0 }], // For animation potential
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  saveIconContainer: {
    backgroundColor: '#10b981', // Green for save
    borderWidth: 4,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  templateIconContainer: {
    backgroundColor: '#8b5cf6', // Purple for templates
    borderWidth: 4,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  pdfIconContainer: {
    backgroundColor: '#3b82f6', // Blue for PDF
    borderWidth: 4,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  shareIconContainer: {
    backgroundColor: '#f97316', // Orange for share
    borderWidth: 4,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  actionCardDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  modernBottomSpacer: {
    height: 100,
  },
  
  // Resume Header Card Styles
  resumeHeaderCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  resumeHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resumeHeaderIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  resumeHeaderTextContainer: {
    flex: 1,
  },
  resumeHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  resumeHeaderSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  resumeStatusContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  resumeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  resumeStatusActive: {
    backgroundColor: '#dcfce7',
  },
  resumeStatusPending: {
    backgroundColor: '#fef3c7',
  },
  resumeStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resumeStatusActiveText: {
    color: '#10b981',
  },
  resumeStatusPendingText: {
    color: '#f59e0b',
  },
  
  // Resume Templates Section Styles
  modernTemplatesSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  
  modernSectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  
  modernTemplatesScrollView: {
    marginHorizontal: -20,
  },
  
  modernTemplatesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  
  modernTemplatePreviewCard: {
    width: 140,
    alignItems: 'center',
  },
  
  modernTemplatePreview: {
    width: 120,
    height: 160,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  
  modernTemplateSelected: {
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
  },
  
  modernTemplateHeader: {
    marginBottom: 8,
    gap: 4,
  },
  
  modernTemplateBody: {
    gap: 3,
  },
  
  modernTemplateLine: {
    height: 2,
    borderRadius: 1,
    marginBottom: 2,
  },
  
  modernTemplateCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  
  modernTemplateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  
  modernTemplateDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  modernSelectedTemplateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  
  modernSelectedTemplateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  
  // Modern Modal Styles - Enhanced with Glassmorphism
  modernModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modernModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  modernCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modernTemplateScrollView: {
    maxHeight: 500, // Increased height for better viewing
  },
  modernTemplateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 24,
    gap: 16,
    justifyContent: 'space-between',
  },
  modernTemplateCard: {
    width: '47%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modernTemplateSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  modernTemplatePreview: {
    width: 70, // Increased size
    height: 90, // Increased size
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  modernTemplateHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24, // Increased height
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modernTemplateName: {
    fontSize: 16, // Increased size
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  modernTemplateDescription: {
    fontSize: 13, // Increased size
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  modernSelectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26, // Increased size
    height: 26, // Increased size
    borderRadius: 13,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Modern PDF Modal Styles
  modernSuccessHeader: {
    alignItems: 'center',
    padding: 32,
  },
  modernSuccessIcon: {
    marginBottom: 16,
  },
  modernSuccessTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  modernSuccessSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  modernPdfActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modernPdfButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modernViewButton: {
    backgroundColor: '#3b82f6',
  },
  modernDownloadButton: {
    backgroundColor: '#10b981',
  },
  modernPdfButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  modernCloseModalButton: {
    margin: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modernCloseModalText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  
  // Legacy styles for compatibility
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Enhanced Modal Styles
  enhancedModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 20,
  },
  enhancedPdfModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  
  // Clean PDF Modal Styles
  cleanPdfOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Enhanced Tickets Header Styles (copied exactly from Support Tickets)
  enhancedTicketsHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 35,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  enhancedTicketsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    letterSpacing: -0.5,
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTemplateIcon: {
    backgroundColor: '#f3e8ff',
    padding: 8,
    borderRadius: 8,
    marginLeft: 12,
  },

  // Enhanced PDF Modal Styles - Modern Glassmorphism
  enhancedPdfOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Darker, more premium feel
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backdropFilter: 'blur(10px)', // This won't work on all devices but adds to the design
  },
  enhancedPdfModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  enhancedPdfHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  enhancedPdfIconContainer: {
    backgroundColor: '#fef2f2',
    padding: 20,
    borderRadius: 60,
    marginBottom: 20,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  enhancedPdfTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  enhancedPdfSubtitle: {
    fontSize: 17,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  enhancedPdfPreviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  enhancedPdfPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  enhancedPdfPreviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 10,
  },
  enhancedPdfPreviewBody: {
    paddingLeft: 34,
  },
  enhancedPdfPreviewText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
  },
  enhancedPdfActions: {
    gap: 16,
    marginBottom: 24,
  },
  enhancedPdfButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedViewButton: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  enhancedDownloadButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  enhancedButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  enhancedPdfButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  enhancedDownloadButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
    letterSpacing: 0.2,
  },
  enhancedCloseButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  enhancedCloseButtonText: {
    fontSize: 17,
    color: '#64748b',
    fontWeight: '600',
  },
  ticketsHeaderStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketStatItem: {
    alignItems: 'center',
  },
  ticketStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
  },
  ticketStatLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  ticketStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
});
export default ResumeScreen;
