import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert,
  RefreshControl, Image, Dimensions, StatusBar, SafeAreaView, Platform, ToastAndroid, Animated, TextInput, Linking,
   Easing, ImageBackground, Pressable, useWindowDimensions, BackHandler,} from 'react-native';
import Constants from 'expo-constants';
import { MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons, Feather, AntDesign, SimpleLineIcons } from '@expo/vector-icons';
import axios from 'axios';
import { IP } from '../../ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import ResumeScreen from './ResumeScreen';
import AttendanceScreen from './AttendanceScreen';

// ...existing code...

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#2563eb', 
  secondary: '#f1f5f9', 
  accent: '#22d3ee', 
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  danger: '#ef4444',
  success: '#22c55e',
  sidebar: '#1e293b', 
  sidebarActive: '#2563eb',
  sidebarInactive: '#cbd5e1',
  white: '#ffffff',
  black: '#0f172a',
  shadow: 'rgba(37, 99, 235, 0.08)',
};


const AnimatedCard = ({ children, delay = 0, style, onPress }) => {
const translateY = useRef(new Animated.Value(50)).current;
const opacity = useRef(new Animated.Value(0)).current;
const scale = useRef(new Animated.Value(0.95)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animatedStyle = {
    transform: [{ translateY }, { scale }],
    opacity,
  };

  if (onPress) {
    return (
      <Animated.View style={[style, animatedStyle]}>
        <Pressable 
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ flex: 1 }}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};


const HomeScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTimeState, setCurrentTimeState] = useState('');
  const [currentDateState, setCurrentDateState] = useState('');
  const [weatherInfo, setWeatherInfo] = useState({ temp: '22°C', condition: 'Sunny' });
  const [notifications, setNotifications] = useState(3);
  const { width } = useWindowDimensions();

  // ...existing code...
  
  
  useEffect(() => {
    
    const updateDateTime = () => {
      const now = new Date();
      
      
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedHour = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const timeString = `${formattedHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      setCurrentTimeState(timeString);
      
      
      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      const dateString = now.toLocaleDateString('en-US', options);
      setCurrentDateState(dateString);
    };
    
    
    updateDateTime();
    
    
    const intervalId = setInterval(updateDateTime, 60000);
    
    
    return () => clearInterval(intervalId);
  }, []);
  
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

    
      const profileResponse = await axios.get(`http://${IP}:3000/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(profileResponse.data);

      
      const tasksResponse = await axios.get(`http://${IP}:3000/api/student/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasksResponse.data.slice(0, 3));

    
      const ticketsResponse = await axios.get(`http://${IP}:3000/api/student/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(ticketsResponse.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      return () => {};
    }, [])
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loaderText}>Loading your dashboard...</Text>
      </View>
    );
  }

  // ...existing code...

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      {/* Chat Modal removed */}
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b82f6"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Stats Overview with Better Visual Hierarchy */}
        <View style={styles.statsSection}>
          <View style={styles.enhancedStatsGrid}>
            <AnimatedCard delay={100} style={styles.enhancedStatCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}> 
                  <MaterialIcons name="assignment" size={24} color="#3b82f6" />
                </View>
                <View style={styles.statTrendIndicator}>
                  <MaterialIcons name="trending-up" size={16} color="#10b981" />
                </View>
              </View>
              <Text style={styles.enhancedStatValue}>{tasks.length}</Text>
              <Text style={styles.enhancedStatLabel}>Active Tasks</Text>
              <View style={styles.statProgress}>
                <View style={[styles.statProgressBar, { width: `${Math.min((tasks.length / 10) * 100, 100)}%`, backgroundColor: '#3b82f6' }]} />
              </View>
            </AnimatedCard>

            <AnimatedCard delay={200} style={styles.enhancedStatCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: '#dcfce7' }]}> 
                  <MaterialIcons name="support" size={24} color="#10b981" />
                </View>
                <View style={styles.statTrendIndicator}>
                  <MaterialIcons name="trending-flat" size={16} color="#f59e0b" />
                </View>
              </View>
              <Text style={styles.enhancedStatValue}>{tickets.length}</Text>
              <Text style={styles.enhancedStatLabel}>Support Tickets</Text>
              <View style={styles.statProgress}>
                <View style={[styles.statProgressBar, { width: `${Math.min((tickets.length / 5) * 100, 100)}%`, backgroundColor: '#10b981' }]} />
              </View>
            </AnimatedCard>

            <AnimatedCard delay={300} style={styles.enhancedStatCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: '#fef3c7' }]}> 
                  <MaterialIcons name="grade" size={24} color="#f59e0b" />
                </View>
                <View style={styles.statTrendIndicator}>
                  <MaterialIcons name="trending-up" size={16} color="#10b981" />
                </View>
              </View>
              <Text style={styles.enhancedStatValue}>A-</Text>
              <Text style={styles.enhancedStatLabel}>Avg Grade</Text>
              <View style={styles.statProgress}>
                <View style={[styles.statProgressBar, { width: '85%', backgroundColor: '#f59e0b' }]} />
              </View>
            </AnimatedCard>
          </View>
        </View>

        {/* Recent Activity Section */}
        <AnimatedCard delay={500} style={styles.enhancedActivityCard}>
          <View style={styles.cardHeaderWithAction}>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#dbeafe' }]}>
                <MaterialIcons name="assignment-turned-in" size={20} color="#3b82f6" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Task Completed</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#dcfce7' }]}>
                <MaterialIcons name="support" size={20} color="#10b981" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Support Ticket Created</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#fef3c7' }]}>
                <MaterialIcons name="update" size={20} color="#f59e0b" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Profile Updated</Text>
                <Text style={styles.activityTime}>3 days ago</Text>
              </View>
            </View>
          </View>
        </AnimatedCard>

        {/* Progress Overview */}
        <AnimatedCard delay={600} style={styles.enhancedProgressCard}>
          <View style={styles.progressItems}>
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Course Completion</Text>
                <Text style={styles.progressValue}>75%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: '75%', backgroundColor: '#3b82f6' }]} />
              </View>
            </View>
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Assignment Submission</Text>
                <Text style={styles.progressValue}>90%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: '90%', backgroundColor: '#10b981' }]} />
              </View>
            </View>
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Attendance</Text>
                <Text style={styles.progressValue}>95%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: '95%', backgroundColor: '#f59e0b' }]} />
              </View>
            </View>
          </View>
        </AnimatedCard>

        {/* Footer with App Info */}
        <View style={styles.enhancedFooter}>
          <Text style={styles.footerText}>University Management System</Text>
          <Text style={styles.footerVersion}>Version 2.1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Tasks Screen Component
const TasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [taskLink, setTaskLink] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Get tasks from the API
      const response = await axios.get(`http://${IP}:3000/api/student/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Get locally completed tasks from AsyncStorage
      const completedTasksJson = await AsyncStorage.getItem('completedTasks');
      const completedTasks = completedTasksJson ? JSON.parse(completedTasksJson) : [];
      
      // Apply local completion status to tasks from API
      if (completedTasks.length > 0) {
        const updatedTasks = response.data.map(task => {
          // If the task is in our locally completed list, mark it as completed
          if (completedTasks.includes(task.id)) {
            return { ...task, status: 'completed' };
          }
          return task;
        });
        setTasks(updatedTasks);
      } else {
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to load tasks. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const updateTaskStatus = async (taskId) => {
    try {
      console.log(`Marking task ${taskId} as completed`);
      
      // Get the token for authentication
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        return false;
      }
      
      // First update the task in the local state for immediate UI feedback
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: 'completed' } : task
        )
      );
      
      // If a task is selected in the modal, update it too
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: 'completed' });
        setSelectedStatus('completed');
      }
      
      // Make API call to update the task status in the database
      try {
        console.log(`Sending API request to update task ${taskId} status to completed`);
        
        // Try the primary endpoint first
        const response = await axios.put(
          `http://${IP}:3000/api/student/tasks/${taskId}/status`,
          { status: 'completed' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('API response:', response.data);
        
        if (response.data.success) {
          console.log(`Task ${taskId} marked as completed in the database`);
          
          // Store the completed task ID in AsyncStorage for persistence
          try {
            // Get existing completed tasks
            const completedTasksJson = await AsyncStorage.getItem('completedTasks');
            let completedTasks = completedTasksJson ? JSON.parse(completedTasksJson) : [];
            
            // Add the new task ID if it's not already in the list
            if (!completedTasks.includes(taskId)) {
              completedTasks.push(taskId);
              await AsyncStorage.setItem('completedTasks', JSON.stringify(completedTasks));
            }
            
            console.log(`Task ${taskId} also saved to AsyncStorage for offline access`);
          } catch (storageError) {
            console.error('Error saving to AsyncStorage:', storageError);
            // Continue even if AsyncStorage fails
          }
          
          // Show success message
          if (Platform.OS === 'android') {
            ToastAndroid.show('Task marked as completed', ToastAndroid.SHORT);
          } else {
            Alert.alert('Success', 'Task marked as completed');
          }
          
          return true;
        } else {
          throw new Error('API returned success: false');
        }
      } catch (apiError) {
        console.error('Error updating task status via API:', apiError);
        
        // Try alternative endpoint if the first one fails
        try {
          console.log('Trying alternative endpoint...');
          const altResponse = await axios.put(
            `http://${IP}:3000/api/student/update-task-status/${taskId}`,
            { status: 'completed' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (altResponse.data.success) {
            console.log('Alternative endpoint succeeded');
            
            // Show success message
            if (Platform.OS === 'android') {
              ToastAndroid.show('Task marked as completed', ToastAndroid.SHORT);
            } else {
              Alert.alert('Success', 'Task marked as completed');
            }
            
            return true;
          } else {
            throw new Error('Alternative API returned success: false');
          }
        } catch (altApiError) {
          console.error('Error with alternative endpoint:', altApiError);
          
          // As a last resort, try the direct completion endpoint
          try {
            console.log('Trying direct completion endpoint...');
            const directResponse = await axios.post(
              `http://${IP}:3000/api/student/complete-task/${taskId}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (directResponse.data.success) {
              console.log('Direct completion endpoint succeeded');
              
              // Show success message
              if (Platform.OS === 'android') {
                ToastAndroid.show('Task marked as completed', ToastAndroid.SHORT);
              } else {
                Alert.alert('Success', 'Task marked as completed');
              }
              
              return true;
            } else {
              throw new Error('Direct API returned success: false');
            }
          } catch (directApiError) {
            console.error('All API attempts failed:', directApiError);
            Alert.alert(
              'Warning', 
              'Task marked as completed locally, but could not update the server. The change will sync when you reconnect.',
              [{ text: 'OK' }]
            );
            return true; // Return true since we've updated locally
          }
        }
      }
    } catch (error) {
      console.error('Error in updateTaskStatus function:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return false;
    }
  };

  const onRefresh = useCallback(() => {
    console.log('Refreshing tasks list...');
    setRefreshing(true);
    // Clear any selected task
    setSelectedTask(null);
    // Fetch fresh data
    fetchTasks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      return () => {};
    }, [])
  );

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { bg: '#d1fae5', text: '#10b981', icon: 'check-circle' };
      case 'in progress':
        return { bg: '#e0f2fe', text: '#0ea5e9', icon: 'autorenew' };
      case 'pending':
        return { bg: '#fef3c7', text: '#d97706', icon: 'schedule' };
      default:
        return { bg: '#fee2e2', text: '#ef4444', icon: 'error-outline' };
    }
  };

  // Initialize form when a task is selected
  const initializeTaskForm = (task) => {
    setSelectedTask(task);
    setTaskLink(task.link || '');
    setSelectedStatus(task.status || 'pending');
    setStatusDropdownVisible(false);
    setModalVisible(true);
    
    // Log task details for debugging
    console.log(`Task selected: ID=${task.id}, Status=${task.status}, Link=${task.link ? 'Yes' : 'No'}`);
  };

  // Save task updates including notes, link and status
  const saveTaskUpdates = async () => {
    if (!selectedTask) return false;
    
    try {
      setIsLoading(true);
      
      // Get the token for authentication
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        setIsLoading(false);
        return false;
      }
      
      // Prepare updated task data
      const updatedTaskData = {
        status: selectedStatus,
        link: taskLink
      };
      
      console.log(`Updating task ${selectedTask.id} with status: ${selectedStatus}`);
      console.log('Task update data:', JSON.stringify(updatedTaskData, null, 2));
      
      // Update task in local state first for immediate UI feedback
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === selectedTask.id ? { ...task, ...updatedTaskData } : task
        )
      );
      
      // Update selected task in modal
      setSelectedTask({ ...selectedTask, ...updatedTaskData });
      
      // Handle completedTasks in AsyncStorage based on status
      try {
        // Get existing completed tasks
        const completedTasksJson = await AsyncStorage.getItem('completedTasks');
        let completedTasks = completedTasksJson ? JSON.parse(completedTasksJson) : [];
        
        if (selectedStatus.toLowerCase() === 'completed') {
          // Add the task ID if it's not already in the list
          if (!completedTasks.includes(selectedTask.id)) {
            completedTasks.push(selectedTask.id);
            await AsyncStorage.setItem('completedTasks', JSON.stringify(completedTasks));
            console.log(`Task ${selectedTask.id} added to completed tasks in AsyncStorage`);
          }
        } else {
          // If status is not completed but task was previously in completedTasks, remove it
          if (completedTasks.includes(selectedTask.id)) {
            completedTasks = completedTasks.filter(id => id !== selectedTask.id);
            await AsyncStorage.setItem('completedTasks', JSON.stringify(completedTasks));
            console.log(`Task ${selectedTask.id} removed from completed tasks in AsyncStorage`);
          }
        }
      } catch (storageError) {
        console.error('Error managing completedTasks in AsyncStorage:', storageError);
        // Continue even if AsyncStorage fails
      }
      
      // Make API call to update the task
      try {
        console.log(`Sending API request to update task ${selectedTask.id} with status: ${selectedStatus}`);
        
        // Try updating the status first
        if (selectedStatus.toLowerCase() === 'completed') {
          try {
            // Try the direct completion endpoint first (this seems to be the most reliable)
            console.log('Trying direct completion endpoint...');
            const directResponse = await axios.post(
              `http://${IP}:3000/api/student/complete-task/${selectedTask.id}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (directResponse.data.success) {
              console.log('Direct completion endpoint succeeded');
              
              // Now update the link
              try {
                await axios.put(
                  `http://${IP}:3000/api/student/tasks/${selectedTask.id}`,
                  { link: taskLink },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              } catch (linkError) {
                console.log('Link update failed, but status was updated successfully');
              }
              
              // Show success message
              if (Platform.OS === 'android') {
                ToastAndroid.show('Task completed successfully', ToastAndroid.SHORT);
              } else {
                Alert.alert('Success', 'Task completed successfully');
              }
              
              setIsLoading(false);
              return true;
            }
          } catch (directError) {
            console.log('Direct completion endpoint failed, trying status update endpoint');
          }
        }
        
        // Try the status update endpoint
        try {
          console.log('Trying status update endpoint...');
          const statusResponse = await axios.put(
            `http://${IP}:3000/api/student/update-task-status/${selectedTask.id}`,
            { status: selectedStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (statusResponse.data.success) {
            console.log('Status update endpoint succeeded');
            
            // Now update the link
            try {
              console.log('Sending link update:', JSON.stringify({ link: taskLink }, null, 2));
              const linkResponse = await axios.put(
                `http://${IP}:3000/api/student/tasks/${selectedTask.id}`,
                { link: taskLink },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log('Link update response:', linkResponse.data);
            } catch (linkError) {
              console.error('Link update failed, but status was updated successfully:', linkError);
            }
            
            // Show success message
            if (Platform.OS === 'android') {
              ToastAndroid.show(`Task ${selectedStatus} successfully`, ToastAndroid.SHORT);
            } else {
              Alert.alert('Success', `Task ${selectedStatus} successfully`);
            }
            
            setIsLoading(false);
            return true;
          }
        } catch (statusError) {
          console.log('Status update endpoint failed, trying general update endpoint');
        }
        
        // Try the general update endpoint
        try {
          console.log('Trying general update endpoint...');
          const response = await axios.put(
            `http://${IP}:3000/api/student/tasks/${selectedTask.id}`,
            updatedTaskData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.success) {
            console.log('General update endpoint succeeded');
            
            // Show success message
            if (Platform.OS === 'android') {
              ToastAndroid.show(`Task ${selectedStatus} successfully`, ToastAndroid.SHORT);
            } else {
              Alert.alert('Success', `Task ${selectedStatus} successfully`);
            }
            
            setIsLoading(false);
            return true;
          }
        } catch (generalError) {
          console.log('General update endpoint failed, trying alternative endpoint');
        }
        
        // Try the alternative update endpoint
        try {
          console.log('Trying alternative update endpoint...');
          const altResponse = await axios.put(
            `http://${IP}:3000/api/student/update-task/${selectedTask.id}`,
            updatedTaskData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (altResponse.data.success) {
            console.log('Alternative update endpoint succeeded');
            
            // Show success message
            if (Platform.OS === 'android') {
              ToastAndroid.show(`Task ${selectedStatus} successfully`, ToastAndroid.SHORT);
            } else {
              Alert.alert('Success', `Task ${selectedStatus} successfully`);
            }
            
            setIsLoading(false);
            return true;
          }
        } catch (altError) {
          console.log('All update endpoints failed');
        }
        
        // If we get here, all API attempts failed
        throw new Error('All API endpoints returned failure');
      } catch (apiError) {
        console.error('Error updating task:', apiError);
        Alert.alert(
          'Warning', 
          'Task updated locally, but could not update the server. The changes will sync when you reconnect.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return true; // Return true since we've updated locally
      }
    } catch (error) {
      console.error('Error in saveTaskUpdates function:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const renderTask = ({ item, index }) => {
    const statusStyle = getStatusColor(item.status);
    const dueDate = new Date(item.due_date);
    const isOverdue = dueDate < new Date() && item.status.toLowerCase() !== 'completed';
    
    return (
      <AnimatedCard delay={index * 100} style={styles.taskCard}>
        <TouchableOpacity 
          style={styles.taskCardTouchable}
          onPress={() => {
            initializeTaskForm(item);
          }}
          activeOpacity={0.7}
        >
          <View 
            style={[
              styles.taskPriorityIndicator, 
              { 
                backgroundColor: isOverdue 
                  ? '#ef4444' 
                  : item.priority === 'high' 
                    ? '#f97316' 
                    : item.priority === 'medium' 
                      ? '#eab308' 
                      : '#6366f1'
              }
            ]} 
          />
          <View style={styles.taskCardContent}>
            <View style={styles.taskCardHeader}>
              <View style={[styles.taskStatusBadge, { backgroundColor: statusStyle.bg }]}>
                <MaterialIcons name={statusStyle.icon} size={18} color={statusStyle.text} />
                <Text style={[styles.taskStatusText, { color: statusStyle.text }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.taskDate}>
                {isOverdue ? '⚠️ ' : ''}Due: {dueDate.toLocaleDateString()}
              </Text>
            </View>
            
            <Text style={styles.taskCardTitle}>{item.title}</Text>
            
            <Text style={styles.taskCardDescription} numberOfLines={2}>
              {item.description}
            </Text>
            
            <View style={styles.taskCardFooter}>
              <View style={styles.assignedByContainer}>
                <MaterialIcons name="person" size={16} color="#64748b" />
                <Text style={styles.assignedByText}>
                  {item.assigned_by}
                </Text>
              </View>
              
              <View style={styles.taskMetaIcons}>
                {item.notes && (
                  <View style={styles.taskMetaIcon}>
                    <MaterialIcons name="note" size={18} color="#6366f1" />
                  </View>
                )}
                {item.link && (
                  <View style={styles.taskMetaIcon}>
                    <MaterialIcons name="link" size={18} color="#6366f1" />
                  </View>
                )}
                <View style={styles.taskCardAction}>
                  <MaterialIcons name="chevron-right" size={22} color="#64748b" />
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loaderText}>Loading your tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.enhancedTasksList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
          }
          ListEmptyComponent={
            <View style={styles.enhancedEmptyState}>
              <View style={styles.emptyStateIcon}>
                <MaterialIcons name="assignment" size={64} color="#d1d5db" />
              </View>
              <Text style={styles.enhancedEmptyTitle}>No tasks available</Text>
              <Text style={styles.enhancedEmptySubtitle}>
                Pull down to refresh or check back later for new assignments
              </Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={onRefresh}>
                <MaterialIcons name="refresh" size={20} color="#3b82f6" />
                <Text style={styles.emptyStateButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.enhancedModalContainer}>
          <View style={styles.enhancedModalView}>
            {selectedTask && (
              <ScrollView>
                {/* Enhanced Header with Status Badge */}
                <View style={styles.enhancedModalHeader}>
                  <View style={styles.enhancedModalHeaderContent}>
                    <Text style={styles.enhancedModalTitle}>{selectedTask.title}</Text>
                    <TouchableOpacity
                      style={styles.enhancedCloseButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <MaterialIcons name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  
                  {(() => {
                    const statusStyle = getStatusColor(selectedTask.status);
                    return (
                      <View style={[styles.enhancedStatusBadge, { backgroundColor: statusStyle.bg }]}>
                        <MaterialIcons name={statusStyle.icon} size={18} color={statusStyle.text} />
                        <Text style={[styles.enhancedStatusText, { color: statusStyle.text }]}>
                          {selectedTask.status.toUpperCase()}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
                
                <View style={styles.enhancedModalContent}>
                  {/* Task Details Card */}
                  <View style={styles.enhancedDetailCard}>
                    <Text style={styles.enhancedDetailTitle}>Task Details</Text>
                    
                    <View style={styles.enhancedDetailRow}>
                      <View style={styles.enhancedDetailIconContainer}>
                        <MaterialIcons name="event" size={20} color="#6366f1" />
                      </View>
                      <View style={styles.enhancedDetailContent}>
                        <Text style={styles.enhancedDetailLabel}>Due Date</Text>
                        <Text style={styles.enhancedDetailValue}>
                          {new Date(selectedTask.due_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.enhancedDetailRow}>
                      <View style={styles.enhancedDetailIconContainer}>
                        <MaterialIcons name="person" size={20} color="#6366f1" />
                      </View>
                      <View style={styles.enhancedDetailContent}>
                        <Text style={styles.enhancedDetailLabel}>Assigned By</Text>
                        <Text style={styles.enhancedDetailValue}>{selectedTask.assigned_by}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Description Card */}
                  <View style={styles.enhancedDescriptionCard}>
                    <Text style={styles.enhancedDescriptionTitle}>Description</Text>
                    <Text style={styles.enhancedDescriptionText}>{selectedTask.description}</Text>
                  </View>
                  
                  {/* Status Selection Card */}
                  <View style={styles.enhancedDetailCard}>
                    <View style={styles.cardHeaderContainer}>
                      <MaterialIcons name="flag" size={20} color="#6366f1" />
                      <Text style={styles.enhancedDetailTitle}>Status</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.statusDropdownButton}
                      onPress={() => setStatusDropdownVisible(!statusDropdownVisible)}
                    >
                      <View style={styles.statusDropdownContent}>
                        <View style={[styles.statusIndicator, { 
                          backgroundColor: getStatusColor(selectedStatus).bg 
                        }]} />
                        <Text style={styles.statusDropdownText}>
                          {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                        </Text>
                      </View>
                      <MaterialIcons 
                        name={statusDropdownVisible ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color="#64748b" 
                      />
                    </TouchableOpacity>
                    
                    {statusDropdownVisible && (
                      <View style={styles.statusOptionsContainer}>
                        {['pending', 'in progress', 'completed', 'incomplete'].map((status) => (
                          <TouchableOpacity
                            key={status}
                            style={styles.statusOption}
                            onPress={() => {
                              setSelectedStatus(status);
                              setStatusDropdownVisible(false);
                            }}
                          >
                            <View style={[styles.statusIndicator, { 
                              backgroundColor: getStatusColor(status).bg 
                            }]} />
                            <Text style={[
                              styles.statusOptionText,
                              selectedStatus === status && styles.selectedStatusText
                            ]}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                            {selectedStatus === status && (
                              <MaterialIcons name="check" size={18} color="#6366f1" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  
                  {/* Notes Card - Removed as per database schema */}
                  
                  {/* Link Card */}
                  <View style={styles.enhancedDetailCard}>
                    <View style={styles.cardHeaderContainer}>
                      <MaterialIcons name="link" size={20} color="#6366f1" />
                      <Text style={styles.enhancedDetailTitle}>Resource Link</Text>
                    </View>
                    
                    <View style={styles.linkInputContainer}>
                      <TextInput
                        style={styles.linkInput}
                        placeholder="Add a resource link..."
                        placeholderTextColor="#94a3b8"
                        value={taskLink}
                        onChangeText={(text) => {
                          console.log('Setting task link to:', text);
                          setTaskLink(text);
                        }}
                      />
                      {taskLink ? (
                        <TouchableOpacity 
                          style={styles.openLinkButton}
                          onPress={() => {
                            let url = taskLink;
                            if (!/^https?:\/\//i.test(url)) {
                              url = 'https://' + url;
                            }
                            Linking.openURL(url).catch(err => 
                              Alert.alert('Error', 'Could not open the link. Please check the URL.')
                            );
                          }}
                        >
                          <MaterialIcons name="open-in-new" size={20} color="#ffffff" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                  
                  {/* Action Buttons */}
                  <View style={styles.enhancedButtonContainer}>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={async () => {
                        // Show loading indicator
                        setIsLoading(true);
                        
                        // Update task with current status, notes and link
                        const success = await saveTaskUpdates();
                        
                        // Hide loading indicator
                        setIsLoading(false);
                        
                        // Always close the modal and refresh the task list
                        // This ensures the UI is updated even if the API call fails
                        setTimeout(() => {
                          setModalVisible(false);
                          // Refresh the task list
                          onRefresh();
                        }, 1000);
                      }}
                    >
                      <MaterialIcons name="send" size={22} color="#ffffff" />
                      <Text style={styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>
                    
                    {selectedStatus.toLowerCase() === 'completed' && (
                      <View style={styles.enhancedCompletedContainer}>
                        <MaterialIcons name="verified" size={24} color="#10b981" />
                        <Text style={styles.enhancedCompletedText}>Task Completed</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={styles.enhancedCloseModalButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.enhancedCloseModalButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Tickets Screen Component
const TicketsScreen = () => {
  const navigation = useNavigation();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTicketModalVisible, setNewTicketModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    type: 'general'
  });

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`http://${IP}:3000/api/student/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      Alert.alert('Error', 'Failed to load tickets. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const createTicket = async () => {
    try {
      // Validate inputs
      if (!newTicket.subject.trim()) {
        Alert.alert('Error', 'Please enter a subject for your ticket');
        return;
      }
      
      if (!newTicket.description.trim()) {
        Alert.alert('Error', 'Please enter a description for your ticket');
        return;
      }
      
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.post(
        `http://${IP}:3000/api/student/tickets`,
        {
          subject: newTicket.subject.trim(),
          description: newTicket.description.trim(),
          type: newTicket.type
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data && response.data.success) {
        // Reset form
        setNewTicket({
          subject: '',
          description: '',
          type: 'general'
        });
        
        // Close modal
        setNewTicketModalVisible(false);
        
        // Show success message
        if (Platform.OS === 'android') {
          ToastAndroid.show('Ticket created successfully', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Your ticket has been submitted successfully');
        }
        
        // Refresh tickets list
        fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      Alert.alert(
        'Error',
        `Failed to create ticket: ${error.response?.data?.error || error.message || 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
      return () => {};
    }, [])
  );

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return { bg: '#d1fae5', text: '#10b981', icon: 'check-circle' };
      case 'pending':
        return { bg: '#fef3c7', text: '#d97706', icon: 'hourglass-empty' };
      case 'approved':
        return { bg: '#dbeafe', text: '#3b82f6', icon: 'thumb-up' };
      case 'rejected':
        return { bg: '#fee2e2', text: '#ef4444', icon: 'thumb-down' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', icon: 'help-outline' };
    }
  };

  const renderTicket = ({ item, index }) => {
    const statusStyle = getStatusStyle(item.status);
    const date = new Date(item.created_at);
    const formattedDate = date.toLocaleDateString();
    const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    const timeAgo = daysAgo === 0 
      ? 'Today' 
      : daysAgo === 1 
        ? 'Yesterday' 
        : `${daysAgo} days ago`;
    
    return (
      <AnimatedCard delay={index * 100} style={styles.ticketCard}>
        <TouchableOpacity 
          style={styles.ticketCardContent}
          onPress={() => {
            setSelectedTicket(item);
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.ticketCardHeader}>
            <View style={[styles.ticketStatusBadge, { backgroundColor: statusStyle.bg }]}>
              <MaterialIcons name={statusStyle.icon} size={18} color={statusStyle.text} />
              <Text style={[styles.ticketStatusText, { color: statusStyle.text }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            <View style={styles.ticketDateContainer}>
              <MaterialIcons name="access-time" size={14} color="#64748b" />
              <Text style={styles.ticketDate}>{timeAgo}</Text>
            </View>
          </View>
          
          <Text style={styles.ticketCardTitle}>{item.subject}</Text>
          
          <Text style={styles.ticketCardDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.ticketCardFooter}>
            {item.type && (
              <View style={styles.ticketTypeContainer}>
                <MaterialIcons name="label" size={16} color="#64748b" />
                <Text style={styles.ticketTypeText}>
                  {item.type.replace(/_/g, ' ')}
                </Text>
              </View>
            )}
            
            <View style={styles.ticketCardAction}>
              <MaterialIcons name="chevron-right" size={22} color="#64748b" />
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loaderText}>Loading your tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicket}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.enhancedTicketsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
          }
          ListEmptyComponent={
            <View style={styles.enhancedEmptyState}>
              <View style={styles.emptyStateIcon}>
                <MaterialIcons name="confirmation-number" size={64} color="#d1d5db" />
              </View>
              <Text style={styles.enhancedEmptyTitle}>No support tickets</Text>
              <Text style={styles.enhancedEmptySubtitle}>
                Create a new ticket to get help from our support team
              </Text>
              <TouchableOpacity 
                style={styles.enhancedCreateTicketButton} 
                onPress={() => setNewTicketModalVisible(true)}
              >
                <MaterialIcons name="add" size={20} color="#ffffff" />
                <Text style={styles.enhancedCreateTicketText}>Create Ticket</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      <TouchableOpacity
        style={styles.enhancedFloatingButton}
        onPress={() => {
          // Create a new ticket form modal
          setSelectedTicket(null);
          setNewTicketModalVisible(true);
        }}
      >
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.enhancedModalContainer}>
          <View style={styles.enhancedModalView}>
            {selectedTicket && (
              <ScrollView>
                {/* Enhanced Header with Status Badge */}
                <View style={styles.enhancedModalHeader}>
                  <View style={styles.enhancedModalHeaderContent}>
                    <Text style={styles.enhancedModalTitle}>{selectedTicket.subject}</Text>
                    <TouchableOpacity
                      style={styles.enhancedCloseButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <MaterialIcons name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  
                  {(() => {
                    const statusStyle = getStatusStyle(selectedTicket.status);
                    return (
                      <View style={[styles.enhancedStatusBadge, { backgroundColor: statusStyle.bg }]}>
                        <MaterialIcons name={statusStyle.icon} size={18} color={statusStyle.text} />
                        <Text style={[styles.enhancedStatusText, { color: statusStyle.text }]}>
                          {selectedTicket.status.toUpperCase()}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
                
                <View style={styles.enhancedModalContent}>
                  {/* Ticket Details Card */}
                  <View style={styles.enhancedDetailCard}>
                    <Text style={styles.enhancedDetailTitle}>Ticket Information</Text>
                    
                    <View style={styles.enhancedDetailRow}>
                      <View style={styles.enhancedDetailIconContainer}>
                        <MaterialIcons name="event" size={20} color="#6366f1" />
                      </View>
                      <View style={styles.enhancedDetailContent}>
                        <Text style={styles.enhancedDetailLabel}>Created On</Text>
                        <Text style={styles.enhancedDetailValue}>
                          {new Date(selectedTicket.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    
                    {selectedTicket.type && (
                      <View style={styles.enhancedDetailRow}>
                        <View style={styles.enhancedDetailIconContainer}>
                          <MaterialIcons name="label" size={20} color="#6366f1" />
                        </View>
                        <View style={styles.enhancedDetailContent}>
                          <Text style={styles.enhancedDetailLabel}>Ticket Type</Text>
                          <Text style={styles.enhancedDetailValue}>
                            {selectedTicket.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                  
                  {/* Description Card */}
                  <View style={styles.enhancedDescriptionCard}>
                    <Text style={styles.enhancedDescriptionTitle}>Description</Text>
                    <Text style={styles.enhancedDescriptionText}>{selectedTicket.description}</Text>
                  </View>
                  
                  {/* Response Card - Only shown if there's a response */}
                  {selectedTicket.response && (
                    <View style={styles.enhancedResponseCard}>
                      <View style={styles.enhancedResponseHeader}>
                        <MaterialIcons name="comment" size={20} color="#6366f1" />
                        <Text style={styles.enhancedResponseTitle}>Staff Response</Text>
                      </View>
                      <Text style={styles.enhancedResponseText}>{selectedTicket.response}</Text>
                      
                      {/* Show who approved the ticket if it's approved */}
                      {selectedTicket.status === 'approved' && (
                        <View style={styles.approverInfo}>
                          <MaterialIcons name="verified" size={18} color="#10b981" />
                          <Text style={styles.approverText}>
                            {selectedTicket.response.includes('faculty') 
                              ? 'Approved by Faculty' 
                              : 'Approved by Admin'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Action Buttons */}
                  <View style={styles.enhancedButtonContainer}>
                    <TouchableOpacity
                      style={styles.enhancedCloseModalButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.enhancedCloseModalButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Profile Screen Component
const ProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null); // null, 'pending', or 'approved'
  const [approvedTicketId, setApprovedTicketId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fullPhotoVisible, setFullPhotoVisible] = useState(false);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      
      // Fetch profile
      const profileResponse = await axios.get(`http://${IP}:3000/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(profileResponse.data);
      
      // Fetch tickets to check for profile update tickets
      const ticketsResponse = await axios.get(`http://${IP}:3000/api/student/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const profileTickets = ticketsResponse.data.filter(ticket => ticket.type === 'profile_update');
      const pendingTicket = profileTickets.find(ticket => ticket.status === 'pending');
      const approvedTicket = profileTickets.find(ticket => ticket.status === 'approved');
      
      if (pendingTicket) {
        setTicketStatus('pending');
        setApprovedTicketId(null);
      } else if (approvedTicket) {
        setTicketStatus('approved');
        setApprovedTicketId(approvedTicket.id);
      } else {
        setTicketStatus(null);
        setApprovedTicketId(null);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
      return () => {};
    }, [])
  );

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (useCamera = false) => {
    try {
      // Request permissions
      let permissionResult;
      
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        permissionResult = { granted: status === 'granted' };
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        permissionResult = { granted: status === 'granted' };
      }
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required', 
          `Please grant ${useCamera ? 'camera' : 'photo library'} access to upload a profile photo.`
        );
        return;
      }
      
      // Launch camera or image picker
      const pickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };
      
      const result = useCamera 
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);
      
      if (result.canceled) {
        return;
      }
      
      // Upload the image
      setUploadingPhoto(true);
      const token = await AsyncStorage.getItem('token');
      
      // Create form data for the upload
      const formData = new FormData();
      formData.append('photo', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'profile-photo.jpg',
      });
      
      // Upload to server
      const response = await axios.post(
        `http://${IP}:3000/api/student/upload-photo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // Update profile with new photo URL
      if (response.data.success) {
        setProfile(prev => ({
          ...prev,
          photo: response.data.photo
        }));
        
        Alert.alert('Success', 'Profile photo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Error', 'Failed to upload profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      setPhotoModalVisible(false);
    }
  };
  
  // Remove profile photo
  const handleRemovePhoto = async () => {
    try {
      setUploadingPhoto(true);
      const token = await AsyncStorage.getItem('token');
      
      // Call API to remove photo
      const response = await axios.post(
        `http://${IP}:3000/api/student/remove-photo`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        setProfile(prev => ({
          ...prev,
          photo: null
        }));
        
        Alert.alert('Success', 'Profile photo removed successfully');
      }
    } catch (error) {
      console.error('Error removing profile photo:', error);
      Alert.alert('Error', 'Failed to remove profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      setPhotoModalVisible(false);
    }
  };

  const handleRaiseTicket = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const requestData = {
        subject: 'Profile Update Request',
        description: 'I would like to request permission to update my profile information. This request will be reviewed by both faculty and admin staff.',
        type: 'profile_update',
        requested_updates: JSON.stringify({}), // Empty updates, as specifics are entered later
        visible_to: 'admin,faculty' // Make sure the ticket is visible to both admin and faculty
      };
      
      console.log('Creating profile update ticket with data:', requestData);
      
      const response = await axios.post(
        `http://${IP}:3000/api/student/profile-update-ticket`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        Alert.alert(
          'Success',
          'Profile update ticket raised successfully. Your request will be reviewed by both admin and faculty staff. Either of them can approve your request.',
          [{ text: 'OK', onPress: fetchProfileData }]
        );
      }
    } catch (error) {
      console.error('Error raising ticket:', error);
      Alert.alert(
        'Error',
        `Failed to raise ticket: ${error.response?.data?.error || error.message || 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = () => {
    if (approvedTicketId) {
      // Navigate directly without using getParent()
      navigation.navigate('EditProfile', {
        ticketId: approvedTicketId,
        updates: {} // Empty updates, as specifics are entered in EditProfileScreen
      });
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        {/* Profile Header with Photo */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={() => setPhotoModalVisible(true)}
            activeOpacity={0.8}
          >
             {profile?.photo ? (
              <Image 
                source={{ uri: profile.photo }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.defaultAvatarContainer}>
                <Text style={styles.defaultAvatarText}>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                </Text>
              </View>
            )}
            
            {/* Camera icon overlay */}
            <View style={styles.cameraIconOverlay}>
              <MaterialIcons name="camera-alt" size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.profileName}>{profile?.name || 'Student'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || 'No email available'}</Text>
        </View>
        
        {/* Student Information Card - Admin Style */}
        <AnimatedCard delay={100} style={styles.profileInfoCard}>
          <Text style={styles.profileInfoTitle}>Student Information</Text>
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="badge" size={20} color="#3b82f6"/>
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Student ID</Text>
              <Text style={styles.profileInfoValue}>{profile?.id || 'Not available'}</Text>
            </View>
          </View>
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="person" size={20} color="#3b82f6" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Full Name</Text>
              <Text style={styles.profileInfoValue}>{profile?.name || 'Not available'}</Text>
            </View>
          </View>
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="email" size={20} color="#3b82f6" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Email Address</Text>
              <Text style={styles.profileInfoValue}>{profile?.email || 'Not available'}</Text>
            </View>
          </View>
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="school" size={20} color="#3b82f6" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Branch/Department</Text>
              <Text style={styles.profileInfoValue}>{profile?.branch || 'Not available'}</Text>
            </View>
          </View>
          
          {/* Profile Update Actions */}
          {ticketStatus === 'pending' ? (
          <View style={styles.profileActionButton}>
            <View style={[styles.profileActionIconContainer, {backgroundColor: '#fef3c7'}]}>
              <MaterialIcons name="hourglass-empty" size={20} color="#f59e0b" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileActionText}>Update Request Pending</Text>
              <Text style={styles.profileInfoLabel}>Being reviewed by administration</Text>
            </View>
          </View>
        ) : ticketStatus === 'approved' ? (
          <TouchableOpacity style={styles.profileActionButton} onPress={handleUpdateProfile}>
            <View style={[styles.profileActionIconContainer, {backgroundColor: '#dcfce7'}]}>
              <MaterialIcons name="check-circle" size={20} color="#10b981" />
            </View>
            <Text style={styles.profileActionText}>Update Profile Now</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.profileActionButton} onPress={handleRaiseTicket}>
            <View style={styles.profileActionIconContainer}>
              <MaterialIcons name="edit" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.profileActionText}>Request Profile Update</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
        </AnimatedCard>
        
        {/* Profile Photo Modal */}
        <Modal
          visible={photoModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPhotoModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.photoModalContent}>
              <View style={styles.photoModalHeader}>
                <Text style={styles.photoModalTitle}>Profile Photo</Text>
                <TouchableOpacity 
                  style={styles.photoModalCloseButton}
                  onPress={() => setPhotoModalVisible(false)}
                >
                  <MaterialIcons name="close" size={24} color={COLORS.gray} />
                </TouchableOpacity>
              </View>
              
              {/* Current Photo Preview */}
              <View style={styles.currentPhotoContainer}>
                {profile?.photo ? (
                  <TouchableOpacity
                    onPress={() => setFullPhotoVisible(true)}
                  >
                    <Image 
                      source={{ uri: profile.photo }} 
                      style={styles.currentPhoto}
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noPhotoPlaceholder}>
                    <MaterialIcons name="person" size={50} color={COLORS.grayLight} />
                    <Text style={styles.noPhotoText}>No photo set</Text>
                  </View>
                )}
              </View>
              
              {/* Photo Options */}
              <View style={styles.photoOptionsContainer}>
                <TouchableOpacity 
                  style={styles.photoOption}
                  onPress={() => handleProfilePhotoUpload(false)}
                  disabled={uploadingPhoto}
                >
                  <View style={styles.photoOptionIcon}>
                    <MaterialIcons name="photo-library" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.photoOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.photoOption}
                  onPress={() => handleProfilePhotoUpload(true)}
                  disabled={uploadingPhoto}
                >
                  <View style={styles.photoOptionIcon}>
                    <MaterialIcons name="camera-alt" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.photoOptionText}>Take a Photo</Text>
                </TouchableOpacity>
                
                {profile?.photo && (
                  <TouchableOpacity 
                    style={[styles.photoOption, styles.removePhotoOption]}
                    onPress={handleRemovePhoto}
                    disabled={uploadingPhoto}
                  >
                    <View style={[styles.photoOptionIcon, styles.removePhotoIcon]}>
                      <MaterialIcons name="delete" size={24} color={COLORS.error} />
                    </View>
                    <Text style={[styles.photoOptionText, styles.removePhotoText]}>Remove Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Loading Indicator */}
              {uploadingPhoto && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.uploadingText}>Processing...</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
        
        {/* Full Photo Modal */}
        <Modal
          visible={fullPhotoVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullPhotoVisible(false)}
        >
          <View style={styles.fullPhotoModalOverlay}>
            <TouchableOpacity 
              style={styles.fullPhotoCloseButton}
              onPress={() => setFullPhotoVisible(false)}
            >
              <MaterialIcons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
            
            <Image 
              source={{ uri: profile?.photo }}
              style={styles.fullPhoto}
              resizeMode="contain"
            />
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

// Sidebar Navigation Item Component
const SidebarItem = ({ icon, label, isActive, onPress, badgeCount }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.sidebarItem, 
        isActive && styles.sidebarItemActive
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.sidebarItemContent}>
        <View style={[
          styles.sidebarIconContainer,
          isActive && styles.sidebarIconContainerActive
        ]}>
          {icon}
        </View>
        <Text style={[
          styles.sidebarLabel,
          isActive && styles.sidebarLabelActive
        ]}>
          {label}
        </Text>
      </View>
      
      {badgeCount > 0 && (
        <View style={styles.sidebarBadge}>
          <Text style={styles.sidebarBadgeText}>{badgeCount}</Text>
        </View>
      )}
      
      {isActive && (
        <View style={styles.sidebarActiveIndicator} />
      )}
    </TouchableOpacity>
  );
};

// Main StudentDashboard Component with Hideable Sidebar Navigation
const StudentDashboard = () => {
  // State for sidebar and content
  const [activeScreen, setActiveScreen] = useState('Home');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskCount, setTaskCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fullPhotoVisible, setFullPhotoVisible] = useState(false);
  
  // Animation values for sidebar
  const sidebarTranslateX = useRef(new Animated.Value(-290)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Get screen dimensions
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  // Navigation
  const navigation = useNavigation();
  
  // Handle profile photo upload
  const handleProfilePhotoUpload = async (useCamera = false) => {
    try {
      // Request permissions
      let permissionResult;
      
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        permissionResult = { granted: status === 'granted' };
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        permissionResult = { granted: status === 'granted' };
      }
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required', 
          `Please grant ${useCamera ? 'camera' : 'photo library'} access to upload a profile photo.`
        );
        return;
      }
      
      // Launch camera or image picker
      const pickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };
      
      const result = useCamera 
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);
      
      if (result.canceled) {
        return;
      }
      
      // Upload the image
      setUploadingPhoto(true);
      const token = await AsyncStorage.getItem('token');
      
      // Create form data for the upload
      const formData = new FormData();
      formData.append('photo', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'profile-photo.jpg',
      });
      
      // Upload to server
      const response = await axios.post(
        `http://${IP}:3000/api/student/upload-photo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // Update profile with new photo URL
      if (response.data.success) {
        setProfile(prev => ({
          ...prev,
          photo: response.data.photo
        }));
        
        Alert.alert('Success', 'Profile photo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Error', 'Failed to upload profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      setPhotoModalVisible(false);
    }
  };
  
  // Remove profile photo
  const handleRemovePhoto = async () => {
    try {
      setUploadingPhoto(true);
      const token = await AsyncStorage.getItem('token');
      
      // Call API to remove photo
      const response = await axios.post(
        `http://${IP}:3000/api/student/remove-photo`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        setProfile(prev => ({
          ...prev,
          photo: null
        }));
        
        Alert.alert('Success', 'Profile photo removed successfully');
      }
    } catch (error) {
      console.error('Error removing profile photo:', error);
      Alert.alert('Error', 'Failed to remove profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      setPhotoModalVisible(false);
    }
  };
  
  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      if (sidebarVisible) {
        toggleSidebar();
        return true;
      } else if (activeScreen !== 'Home') {
        setActiveScreen('Home');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [activeScreen, sidebarVisible]);
  
  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }
        
        // Fetch profile data
        const profileResponse = await axios.get(`http://${IP}:3000/api/student/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileResponse.data);
        
        // Fetch tasks for badge count
        const tasksResponse = await axios.get(`http://${IP}:3000/api/student/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTaskCount(tasksResponse.data.filter(t => t.status === 'pending').length);
        
        // Fetch tickets for badge count
        const ticketsResponse = await axios.get(`http://${IP}:3000/api/student/tickets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTicketCount(ticketsResponse.data.filter(t => t.status === 'open').length);
        
        // Set unread notifications (mock data for now)
        setUnreadNotifications(3);
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load your data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Toggle sidebar visibility
  const toggleSidebar = () => {
    if (sidebarVisible) {
      // Hide sidebar
      Animated.parallel([
        Animated.timing(sidebarTranslateX, {
          toValue: -250, // Ensure it's completely off-screen
          duration: 300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]).start(() => {
        // Only update state after animation completes
        setSidebarVisible(false);
      });
    } else {
      // Show sidebar - update state first, then animate
      setSidebarVisible(true);
      
      // Use requestAnimationFrame to ensure state update has happened
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(sidebarTranslateX, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(overlayOpacity, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]).start();
      });
    }
  };
  
  // Handle screen change
  const handleScreenChange = (screenName) => {
    setActiveScreen(screenName);
  };
  
  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };
  
  // Render the active screen
  const renderScreen = () => {
    switch (activeScreen) {
      case 'Home':
        return <HomeScreen />;
      case 'Tasks':
        return <TasksScreen />;
      case 'Tickets':
        return <TicketsScreen />;
      case 'Resume':
        return <ResumeScreen />;
      case 'Profile':
        return <ProfileScreen />;
      case 'Attendance':
        return <AttendanceScreen />;
      default:
        return <HomeScreen />;
    }
  };
  
  // Get icon for navigation item
  const getNavIcon = (screenName, isActive) => {
    const color = isActive ? COLORS.primary : COLORS.gray;
    const size = 22;
    
    switch (screenName) {
      case 'Home':
        return <Ionicons name={isActive ? 'home' : 'home-outline'} size={size} color={color} />;
      case 'Tasks':
        return <MaterialCommunityIcons name={isActive ? 'clipboard-check' : 'clipboard-outline'} size={size} color={color} />;
      case 'Tickets':
        return <MaterialCommunityIcons name={isActive ? 'ticket-confirmation' : 'ticket-outline'} size={size} color={color} />;
      case 'Resume':
        return <Ionicons name={isActive ? 'document-text' : 'document-text-outline'} size={size} color={color} />;
      case 'Profile':
        return <Ionicons name={isActive ? 'person' : 'person-outline'} size={size} color={color} />;
      case 'Attendance':
        return <MaterialCommunityIcons name={isActive ? 'calendar-check' : 'calendar-check-outline'} size={size} color={color} />;
      default:
        return <Ionicons name="home-outline" size={size} color={color} />;
    }
  };
  
  // Loading screen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.dashboardContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />
      
      <View style={styles.dashboardLayout}>
        {/* Sidebar Overlay - only visible when sidebar is open */}
        {sidebarVisible && (
          <Animated.View 
            style={[
              styles.sidebarOverlay,
              { opacity: overlayOpacity }
            ]}
          >
            <TouchableOpacity 
              style={styles.overlayTouchable}
              activeOpacity={1}
              onPress={toggleSidebar}
            />
          </Animated.View>
        )}
        
        {/* Sidebar - now slides in from left and is scrollable */}
        {sidebarVisible && (
          <Animated.View 
            style={[
              styles.sidebar,
              { transform: [{ translateX: sidebarTranslateX }] }
            ]}
          >
          {/* Sidebar Close Button Only (removed logo and app name for faculty-style match) */}
          <View style={{alignItems: 'flex-end', padding: 12}}>
            <TouchableOpacity 
              style={styles.sidebarCloseButton} 
              onPress={toggleSidebar}
            >
              <MaterialIcons 
                name="close" 
                size={24} 
                color={COLORS.gray} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Scrollable Content */}
          <ScrollView 
            style={styles.sidebarScrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* User Profile - Updated to match Faculty Sidebar */}
            <View style={styles.drawerHeader}>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={() => setPhotoModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={{position:'relative', width:72, height:72, marginBottom:10}}>
                  {profile?.photo ? (
                    <Image 
                      source={{ uri: profile.photo }} 
                      style={{width:72, height:72, borderRadius:36, resizeMode:'cover'}} 
                    />
                  ) : (
                    <View style={styles.drawerAvatarPlaceholder}>
                      <Text style={styles.drawerAvatarText}>
                        {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                      </Text>
                    </View>
                  )}
                  {/* Camera icon overlay */}
                  <View style={styles.cameraIconOverlay}>
                    <MaterialIcons name="camera-alt" size={20} color="#ffffff" />
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={styles.drawerName}>{profile?.name || 'Student'}</Text>
              <Text style={styles.drawerRole}>{profile?.branch || 'University Program'}</Text>
            </View>
            
            {/* Navigation Menu */}
            <View style={styles.navMenu}>
              {/* Dashboard */}
              <TouchableOpacity 
                style={[
                  styles.navItem, 
                  activeScreen === 'Home' && styles.navItemActive
                ]}
                onPress={() => {
                  handleScreenChange('Home');
                  toggleSidebar();
                }}
              >
                <View style={styles.navIconContainer}>
                  {getNavIcon('Home', activeScreen === 'Home')}
                </View>
                <Text 
                  style={[
                    styles.navLabel, 
                    activeScreen === 'Home' && styles.navLabelActive
                  ]}
                  numberOfLines={1}
                >
                  Dashboard
                </Text>
                {activeScreen === 'Home' && (
                  <View style={styles.navActiveIndicator} />
                )}
              </TouchableOpacity>
              
              {/* Tasks */}
              <TouchableOpacity 
                style={[
                  styles.navItem, 
                  activeScreen === 'Tasks' && styles.navItemActive
                ]}
                onPress={() => {
                  handleScreenChange('Tasks');
                  toggleSidebar();
                }}
              >
                <View style={styles.navIconContainer}>
                  {getNavIcon('Tasks', activeScreen === 'Tasks')}
                </View>
                <Text 
                  style={[
                    styles.navLabel, 
                    activeScreen === 'Tasks' && styles.navLabelActive
                  ]}
                  numberOfLines={1}
                >
                  My Tasks
                </Text>
                {taskCount > 0 && (
                  <View style={styles.navBadgeContainer}>
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{taskCount}</Text>
                    </View>
                  </View>
                )}
                {activeScreen === 'Tasks' && (
                  <View style={styles.navActiveIndicator} />
                )}
              </TouchableOpacity>
              
              {/* Tickets */}
              <TouchableOpacity 
                style={[
                  styles.navItem, 
                  activeScreen === 'Tickets' && styles.navItemActive
                ]}
                onPress={() => {
                  handleScreenChange('Tickets');
                  toggleSidebar();
                }}
              >
                <View style={styles.navIconContainer}>
                  {getNavIcon('Tickets', activeScreen === 'Tickets')}
                </View>
                <Text 
                  style={[
                    styles.navLabel, 
                    activeScreen === 'Tickets' && styles.navLabelActive
                  ]}
                  numberOfLines={1}
                >
                  Support Tickets
                </Text>
                {ticketCount > 0 && (
                  <View style={styles.navBadgeContainer}>
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{ticketCount}</Text>
                    </View>
                  </View>
                )}
                {activeScreen === 'Tickets' && (
                  <View style={styles.navActiveIndicator} />
                )}
              </TouchableOpacity>
              
              {/* Resume */}
              <TouchableOpacity 
                style={[
                  styles.navItem, 
                  activeScreen === 'Resume' && styles.navItemActive
                ]}
                onPress={() => {
                  handleScreenChange('Resume');
                  toggleSidebar();
                }}
              >
                <View style={styles.navIconContainer}>
                  {getNavIcon('Resume', activeScreen === 'Resume')}
                </View>
                <Text 
                  style={[
                    styles.navLabel, 
                    activeScreen === 'Resume' && styles.navLabelActive
                  ]}
                  numberOfLines={1}
                >
                  Resume
                </Text>
                {activeScreen === 'Resume' && (
                  <View style={styles.navActiveIndicator} />
                )}
              </TouchableOpacity>
              
              {/* Attendance */}
              <TouchableOpacity 
                style={[
                  styles.navItem, 
                  activeScreen === 'Attendance' && styles.navItemActive
                ]}
                onPress={() => {
                  handleScreenChange('Attendance');
                  toggleSidebar();
                }}
              >
                <View style={styles.navIconContainer}>
                  {getNavIcon('Attendance', activeScreen === 'Attendance')}
                </View>
                <Text 
                  style={[
                    styles.navLabel, 
                    activeScreen === 'Attendance' && styles.navLabelActive
                  ]}
                  numberOfLines={1}
                >
                  Attendance
                </Text>
                {activeScreen === 'Attendance' && (
                  <View style={styles.navActiveIndicator} />
                )}
              </TouchableOpacity>
              
              {/* Profile */}
              <TouchableOpacity 
                style={[
                  styles.navItem, 
                  activeScreen === 'Profile' && styles.navItemActive
                ]}
                onPress={() => {
                  handleScreenChange('Profile');
                  toggleSidebar();
                }}
              >
                <View style={styles.navIconContainer}>
                  {getNavIcon('Profile', activeScreen === 'Profile')}
                </View>
                <Text 
                  style={[
                    styles.navLabel, 
                    activeScreen === 'Profile' && styles.navLabelActive
                  ]}
                  numberOfLines={1}
                >
                  My Profile
                </Text>
                {activeScreen === 'Profile' && (
                  <View style={styles.navActiveIndicator} />
                )}
              </TouchableOpacity>
              
              {/* Logout Button */}
              <TouchableOpacity 
                style={[styles.navItem, styles.logoutButton]}
                onPress={handleLogout}
              >
                <View style={styles.navIconContainer}>
                  <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
                </View>
                <Text style={styles.logoutText} numberOfLines={1}>
                  Logout
                </Text>
              </TouchableOpacity>
              
              {/* Extra padding at bottom for better scrolling */}
              <View style={styles.sidebarBottomPadding} />
            </View>
          </ScrollView>
        </Animated.View>
        )}
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Top Navigation Bar */}
          <View style={styles.topNavBar}>
            <View style={styles.topNavLeft}>
              {/* Hamburger Menu Button (Three Lines) */}
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={toggleSidebar}
              >
                <View style={styles.hamburgerIcon}>
                  <View style={styles.hamburgerLine} />
                  <View style={styles.hamburgerLine} />
                  <View style={styles.hamburgerLine} />
                </View>
              </TouchableOpacity>
              
              <View style={styles.screenTitleContainer}>
                <Text style={styles.screenTitle}>
                  {activeScreen === 'Home' ? 'Dashboard' : activeScreen}
                </Text>
                {activeScreen === 'Home' && (
                  <Text style={styles.screenSubtitle}>
                    Overview of your academic progress and activities
                  </Text>
                )}
                {activeScreen === 'Tasks' && (
                  <Text style={styles.screenSubtitle}>
                    Manage your assignments and deadlines
                  </Text>
                )}
                {activeScreen === 'Tickets' && (
                  <Text style={styles.screenSubtitle}>
                    Track your support requests and inquiries
                  </Text>
                )}
                {activeScreen === 'Resume' && (
                  <Text style={styles.screenSubtitle}>
                    Build and manage your professional profile
                  </Text>
                )}
                {activeScreen === 'Profile' && (
                  <Text style={styles.screenSubtitle}>
                    View and update your personal information
                  </Text>
                )}
                {activeScreen === 'Attendance' && (
                  <Text style={styles.screenSubtitle}>
                    Monitor your class attendance records
                  </Text>
                )}
              </View>
            </View>
            
            {/* Right side with chat button */}
            <View style={styles.topNavRight}>
              <TouchableOpacity
                style={styles.chatIconButton}
                onPress={() => navigation.navigate('ChatListScreen')}
              >
                <MaterialIcons name="chat" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Screen Content */}
          <View style={styles.screenContent}>
            {renderScreen()}
          </View>
        </View>
      </View>
      
      {/* Profile Photo Modal */}
      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoModalContainer}>
            <View style={styles.photoModalHeader}>
              <Text style={styles.photoModalTitle}>Profile Photo</Text>
              <TouchableOpacity 
                onPress={() => setPhotoModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            {uploadingPhoto ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.uploadingText}>Uploading photo...</Text>
              </View>
            ) : (
              <>
                {profile?.photo && (
                  <View style={styles.currentPhotoContainer}>
                    <Image 
                      source={{ uri: profile.photo }} 
                      style={styles.currentPhotoThumbnail}
                    />
                  </View>
                )}
                
                <View style={styles.photoOptionsContainer}>
                  {profile?.photo && (
                    <TouchableOpacity 
                      style={styles.photoOption}
                      onPress={() => {
                        setPhotoModalVisible(false);
                        setFullPhotoVisible(true);
                      }}
                    >
                      <View style={[styles.photoOptionIcon, { backgroundColor: 'rgba(6, 182, 212, 0.1)' }]}>
                        <MaterialIcons name="visibility" size={24} color={COLORS.accent} />
                      </View>
                      <Text style={styles.photoOptionText}>View Photo</Text>
                      <MaterialIcons name="chevron-right" size={20} color={COLORS.grayLight} />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.photoOption}
                    onPress={() => handleProfilePhotoUpload(true)}
                  >
                    <View style={styles.photoOptionIcon}>
                      <MaterialIcons name="camera-alt" size={24} color={COLORS.primary} />
                    </View>
                    <Text style={styles.photoOptionText}>Take Photo</Text>
                    <MaterialIcons name="chevron-right" size={20} color={COLORS.grayLight} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.photoOption}
                    onPress={() => handleProfilePhotoUpload(false)}
                  >
                    <View style={styles.photoOptionIcon}>
                      <MaterialIcons name="photo-library" size={24} color={COLORS.primary} />
                    </View>
                    <Text style={styles.photoOptionText}>Choose from Gallery</Text>
                    <MaterialIcons name="chevron-right" size={20} color={COLORS.grayLight} />
                  </TouchableOpacity>
                  
                  {profile?.photo && (
                    <TouchableOpacity 
                      style={[styles.photoOption, styles.removePhotoOption]}
                      onPress={handleRemovePhoto}
                    >
                      <View style={[styles.photoOptionIcon, styles.removePhotoIcon]}>
                        <MaterialIcons name="delete" size={24} color={COLORS.error} />
                      </View>
                      <Text style={[styles.photoOptionText, styles.removePhotoText]}>Remove Photo</Text>
                      <MaterialIcons name="chevron-right" size={20} color={COLORS.error} style={{ opacity: 0.7 }} />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Full Photo View Modal */}
      <Modal
        visible={fullPhotoVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullPhotoVisible(false)}
      >
        <View style={styles.fullPhotoModalOverlay}>
          <TouchableOpacity 
            style={styles.fullPhotoCloseButton}
            onPress={() => setFullPhotoVisible(false)}
          >
            <MaterialIcons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          
          {profile?.photo && (
            <Image 
              source={{ uri: profile.photo }} 
              style={styles.fullSizePhoto}
              resizeMode="contain"
            />
          )}
          
          <TouchableOpacity 
            style={styles.fullScreenBackdrop}
            activeOpacity={1}
            onPress={() => setFullPhotoVisible(false)}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // ========== MODERN SIDEBAR NAVIGATION STYLES ==========
  
  // Main Container Styles
  dashboardContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight || 0,
  },
  dashboardLayout: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight || 0,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '500',
  },
  
  // Sidebar Styles
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.black,
    zIndex: 9,
  },
  overlayTouchable: {
    width: '100%',
    height: '100%',
  },
  sidebar: {
    width: 260,
    height: '100%',
    backgroundColor: COLORS.sidebar,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight || 0,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative',
  },
  logoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  sidebarCloseButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  // Profile Section Styles
  // Remove sidebarProfile, use drawerHeader instead
  drawerHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.primary,
    marginBottom: 12,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerAvatarText: {
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 72,
  },
  drawerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
    letterSpacing: 0.5,
    textAlign: 'center',
    maxWidth: 180,
  },
  drawerRole: {
    fontSize: 15,
    color: '#e0e7ef',
    marginBottom: 2,
    textAlign: 'center',
    maxWidth: 180,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
    marginBottom: 0,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.sidebarActive,
    backgroundColor: COLORS.card,
  },
  defaultAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.sidebarActive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 56,
  },
  profileInfo: {
    flex: 1,
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    maxWidth: 180,
    flexShrink: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 6,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  profileRole: {
    fontSize: 13,
    color: COLORS.sidebarInactive,
  },
  
  // Sidebar Scroll View
  sidebarScrollView: {
    flex: 1,
  },
  sidebarBottomPadding: {
    height: 20,
  },
  
  // Navigation Menu Styles
  navMenu: {
    paddingTop: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    position: 'relative',
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: COLORS.sidebarActive,
  },
  navIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: COLORS.sidebarInactive,
  },
  navLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.sidebarInactive,
  },
  navLabelActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  navBadgeContainer: {
    marginLeft: 8,
  },
  navBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  navBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  navActiveIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: 4,
    height: 24,
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    transform: [{ translateY: -12 }],
  },
  
  // Logout Button Styles
  logoutButton: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
    flex: 1,
  },
  
  // Main Content Styles
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    zIndex: 1,
  },
  topNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 70,
    width: '100%',
  },
  topNavLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hamburgerIcon: {
    width: 28,
    height: 22,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.dark,
  },
  topNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  topNavBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  topNavBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  chatIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  screenContent: {
    flex: 1,
    padding: 16,
    width: '100%',
  },
  
  // Sidebar Item Component Styles
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12, // Increased from 10 to 12
    paddingHorizontal: 18, // Increased from 14 to 18
    borderRadius: 12,
    marginBottom: 6, // Increased from 4 to 6
    position: 'relative',
  },
  sidebarItemActive: {
    backgroundColor: '#f1f5f9',
  },
  sidebarItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarIconContainer: {
    width: 36, // Increased from 32 to 36
    height: 36, // Increased from 32 to 36
    borderRadius: 10, // Increased from 8 to 10
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // Increased from 10 to 12
  },
  sidebarIconContainerActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  sidebarLabel: {
    fontSize: 15, // Increased from 13 to 15
    fontWeight: '600',
    color: '#64748b',
  },
  sidebarLabelActive: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  sidebarBadge: {
    backgroundColor: '#ef4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sidebarBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  sidebarActiveIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: 4,
    height: 20,
    backgroundColor: '#4f46e5',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    transform: [{ translateY: -10 }],
  },
  
  // Modern Safe Area and Container Styles
  modernSafeArea: {
    flex: 1,
    backgroundColor: '#4f46e5', // Updated to match new color scheme
  },
  modernContainer: {
    flex: 1,
    backgroundColor: '#f8fafc', // Lighter background for better contrast
  },
  modernContentContainer: {
    paddingBottom: 90, // Increased to account for tab bar height
  },
  
  // Modern Header Styles with Gradient Support
  modernHeaderContainer: {
    backgroundColor: '#4f46e5', // Primary indigo color
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    // Add subtle inner border for definition
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modernHeaderGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  modernHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modernHeaderLeft: {
    flex: 1,
  },
  modernHeaderGreeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  modernHeaderName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
    // Add text shadow for better readability
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modernHeaderDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  modernHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modernNotificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // Add subtle border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Add press animation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modernNotificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  modernNotificationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  modernProfileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    // Add subtle border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Add press animation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modernInfoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modernTimeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  modernTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modernWeatherCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  modernWeatherText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modernWeatherCondition: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  
  // Modern Dashboard Container
  modernDashboardContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  
  // Modern Card Styles
  modernOverviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernQuickActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernActivityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernProgressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernCardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernCardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  modernCardMenuButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernViewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  
  // Enhanced Header Styles
  enhancedHeaderContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeftContent: {
    flex: 1,
  },
  enhancedGreeting: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  enhancedUserName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  enhancedProgram: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  enhancedDate: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '400',
  },
  headerRightContent: {
    alignItems: 'flex-end',
    gap: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  enhancedTime: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  enhancedProfileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },

  // Enhanced Stats Section with Modern Design
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: -0.3,
    // Add subtle text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  enhancedStatsGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  enhancedStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    // Enhanced shadow for better depth
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
    // Add subtle border for definition
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.8)',
    // Add subtle inner shadow
    position: 'relative',
    overflow: 'hidden',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    // Add subtle inner shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statTrendIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    // Add subtle border
    borderWidth: 1,
    borderColor: 'rgba(240, 253, 244, 0.8)',
  },
  enhancedStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
    letterSpacing: -0.5,
    // Add subtle text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  enhancedStatLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  statProgress: {
    height: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    // Add subtle border
    borderWidth: 0.5,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
  statProgressBar: {
    height: '100%',
    borderRadius: 3,
    // Add subtle glow effect
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 1,
  },

  // Modern Stats Grid (Legacy)
  modernStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  modernStatItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  modernStatNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  modernStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  modernStatIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Enhanced Quick Actions Card with Modern Design
  enhancedQuickActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 20,
    marginBottom: 24,
    // Enhanced shadow for better depth
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    // Add subtle border for definition
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.8)',
    // Add subtle inner shadow
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  enhancedCardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
    // Add subtle text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderRadius: 20,
    // Add subtle border
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.15)',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5', // Updated to match new color scheme
  },
  enhancedQuickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  enhancedQuickActionItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    // Add subtle border
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    // Add subtle shadow
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  enhancedQuickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    // Add subtle border
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
  enhancedQuickActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 3,
    textAlign: 'center',
    // Add subtle text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  enhancedQuickActionSubtext: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Enhanced Activity Card
  enhancedActivityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },

  // Enhanced Progress Card
  enhancedProgressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  progressItems: {
    gap: 16,
  },
  progressItem: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },

  // Enhanced Footer
  enhancedFooter: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },

  // Modern Quick Actions Grid (Legacy)
  modernQuickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  modernQuickActionItem: {
       flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modernQuickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernQuickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  modernQuickActionSubtext: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Modern Activity List
  modernActivityList: {
    gap: 16,
  },
  modernActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modernActivityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modernActivityContent: {
    flex: 1,
  },
  modernActivityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  modernActivityTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Modern Progress Styles
  modernProgressContent: {
    gap: 20,
  },
  modernProgressItem: {
    gap: 8,
  },
  modernProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  modernProgressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  modernProgressBarContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  modernProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Modern Footer
  modernFooter: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  modernFooterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  modernFooterVersion: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  
  // Legacy Header styles - Matching admin dashboard
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  headerGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 2,
    fontWeight: '500',
  },
  headerDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  headerTimeBox: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 5,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTimeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerProfileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 4,
  },
  profileIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 22,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Loader styles
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Welcome Card styles - Modern design
  welcomeCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 25,
    shadowColor: '#6b8cce',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  welcomeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff', // Subtle blue tint
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e6eeff',
    borderLeftWidth: 4,
    borderLeftColor: '#4a6fa5',
  },
  welcomeCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4a6fa5', // Matching header color
    marginLeft: 14,
    letterSpacing: 0.2,
  },
  welcomeCardContent: {
    padding: 20,
  },
  welcomeCardText: {
    fontSize: 16,
    color: '#4e5d78', // Softer, more modern text color
    lineHeight: 24,
    marginBottom: 24,
  },
  quickLinksContainer: {
    marginTop: 10,
  },
  quickLinksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a6fa5',
    marginBottom: 16,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickLinkItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#6b8cce',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  quickLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4e5d78',
  },
  
  // Stats section - Assignments and Tickets
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#6b8cce',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  statIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#6b8cce',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a6fa5',
       marginBottom: 4,
  },
  statLabel: {
    fontSize: 15,
    color: '#4e5d78',
    fontWeight: '600',
  },
  statArrow: {
    marginLeft: 10,
    color: '#6b8cce',
  },
  
  // Section styles
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
   
    justifyContent: 'space-between',

    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  seeAllButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  
  // Task item styles - Enhanced with modern design
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e6eeff',
    marginBottom: 4,
  },
  taskStatusIndicator: {
    width: 5,
    height: '80%',
    borderRadius: 3,
    marginRight: 14,
  },
  taskIconContainer: {
    marginRight: 14,
  },
  taskContent: {
    flex: 1,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4e5d78',
    marginBottom: 6,
  },
  taskDue: {
    fontSize: 13,
    color: '#1e293b', // Even darker color for better visibility
    fontWeight: '600', // Increased font weight for better readability
  },
  taskStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Ticket item styles - Enhanced with modern design
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e6eeff',
    marginBottom: 4,
  },
  ticketStatus: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#6b8cce',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketContent: {
    flex: 1,
    marginRight: 10,
  },
  ticketTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  ticketMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketDate: {
    fontSize: 13,
    color: '#334155', // Darker color for better visibility (changed from #64748b)
    marginRight: 8,
    fontWeight: '500', // Added font weight for better readability
  },
  ticketTypeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ticketTypeText: {
    fontSize: 12,
    color: '#334155', // Darker color for better visibility (changed from #64748b)
    fontWeight: '500',
  },
  
  // Empty state styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#334155', // Darker color for better visibility (changed from #64748b)
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500', // Added font weight for better readability
  },
  emptyStateButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  
  // Footer - Modern design
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 10,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#e6eeff',
  },
  footerText: {
    fontSize: 14,
    color: '#4e5d78',
    fontWeight: '500',
    textAlign: 'center',
  },
  footerVersion: {
    fontSize: 12,
    color: '#6b8cce',
    marginTop: 6,
    fontWeight: '500',
  },
  
  // Tasks Screen Styles
  screenHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  screenTitleContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  tasksList: {
    padding: 15,
  },
  // Modern Task Card Styles
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    transform: [{ translateY: 0 }], // For animation potential
  },
  taskCardTouchable: {
    flexDirection: 'row',
  },
  taskPriorityIndicator: {
    width: 8,
    height: '100%',
  },
  taskCardContent: {
    flex: 1,
    padding: 20,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  taskDate: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  taskCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  taskCardDescription: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 22,
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  assignedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  assignedByText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  taskMetaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  taskCardAction: {
    backgroundColor: '#eff6ff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // Modern Tickets Screen Styles
  ticketsList: {
    padding: 20,
    paddingBottom: 90, // Extra space for floating button
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 0, // Removed padding to apply it to the touchable content
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  ticketCardContent: {
    padding: 20,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ticketStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  ticketDate: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 6,
  },
  ticketCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  ticketCardDescription: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 22,
  },
  ticketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ticketTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ticketCardAction: {
    backgroundColor: '#eff6ff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketTypeText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  enhancedFloatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  closeModalButton: {
    padding: 5,
  },
  modalContent: {
    padding: 15,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  descriptionContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  responseContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  responseBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  responseText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 15,
  },
  completeTaskButton: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 15,
  },
  completeTaskButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  manualUpdateContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  manualUpdateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 8,
  },
  manualUpdateText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 10,
  },
  manualUpdateStep: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 5,
    paddingLeft: 5,
  },
  manualUpdateHighlight: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Enhanced Modal Styles for Tasks and Tickets
  enhancedModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Darker, more premium overlay
    padding: 20,
    backdropFilter: 'blur(10px)', // This won't work on all devices but adds to the design
  },
  enhancedModalView: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  enhancedModalHeader: {
    backgroundColor: '#6366f1',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  enhancedModalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  enhancedModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  enhancedCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  enhancedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  enhancedStatusText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  enhancedModalContent: {
    padding: 24,
  },
  cardHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  enhancedDetailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  enhancedDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  enhancedDetailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  enhancedDetailIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  enhancedDetailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  enhancedDetailLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  enhancedDetailValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  enhancedDescriptionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  enhancedDescriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  enhancedDescriptionText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  enhancedResponseCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 6,
    borderLeftColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  enhancedResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedResponseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0369a1',
    marginLeft: 10,
    letterSpacing: -0.3,
  },
  enhancedResponseText: {
    fontSize: 16,
    color: '#0c4a6e',
    lineHeight: 24,
    marginBottom: 10,
  },
  approverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 8,
  },
  approverText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  enhancedButtonContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  enhancedCompleteButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedCompleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  enhancedCompletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  enhancedCompletedText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  enhancedCloseModalButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  enhancedCloseModalButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Status dropdown styles
  statusDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  statusDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusDropdownText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  statusOptionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statusOptionText: {
    fontSize: 16,
    color: '#334155',
    flex: 1,
    marginLeft: 8,
  },
  selectedStatusText: {
    fontWeight: '600',
    color: '#0f172a',
  },
  
  // Notes input styles
  notesInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#0f172a',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  // Link input styles
  linkInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#0f172a',
  },
  openLinkButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.2,
  },
  
  // Enhanced Profile Update Request Styles
  enhancedPendingCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  enhancedPendingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  enhancedPendingContent: {
    flex: 1,
  },
  enhancedPendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  enhancedPendingText: {
    fontSize: 14,
    color: '#b45309',
    lineHeight: 20,
  },
  enhancedApprovedContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  enhancedApprovedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  enhancedApprovedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803d',
    marginLeft: 8,
  },
  enhancedApprovedText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    marginBottom: 16,
  },
  enhancedUpdateButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedUpdateButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  enhancedRequestContainer: {
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  enhancedRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  enhancedRequestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5b21b6',
    marginLeft: 8,
  },
  enhancedRequestText: {
    fontSize: 14,
    color: '#6d28d9',
    lineHeight: 20,
    marginBottom: 16,
  },
  enhancedRequestButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedRequestButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Admin-style Profile Styles
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Constants.statusBarHeight,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileAvatarContainer: {
    marginBottom: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  profileInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 20,
  },
  profileInfoRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  profileInfoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  profileInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  profileInfoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  profileActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 15,
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 15,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileActionText: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  logoutAction: {
    borderBottomWidth: 0,
  },
  logoutIconContainer: {
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#ef4444',
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#4b5563', // Darker color for better visibility (changed from #9ca3af)
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '400', // Added font weight for better readability
  },

  // Missing Modern Styles
  modernQuickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  modernStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  modernStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  modernStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },

  // Enhanced Tasks Screen Styles
  enhancedTasksHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  enhancedTasksTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  tasksHeaderStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskStatItem: {
    alignItems: 'center',
  },
  taskStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
  },
  taskStatLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  taskStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  enhancedTasksList: {
    padding: 20,
    paddingBottom: 100,
  },

  // Enhanced Tickets Screen Styles
  enhancedTicketsHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  enhancedTicketsList: {
    padding: 20,
    paddingBottom: 100,
  },

  // Enhanced Empty State Styles
  enhancedEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  enhancedEmptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  enhancedEmptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 300,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  enhancedCreateTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  enhancedCreateTicketText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // Enhanced Floating Button
  enhancedFloatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },

  // Enhanced Profile Screen Styles
  profileContent: {
    paddingTop: 10,
  },
  enhancedProfileHeader: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  profileBackgroundGradient: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
  },
  enhancedProfileAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileAvatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  profileStatusIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  enhancedProfileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  enhancedProfileEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    textAlign: 'center',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  // Profile photo modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
  },
  photoModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    backgroundColor: COLORS.light,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(226, 232, 240, 0.5)',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  uploadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '500',
  },
  currentPhotoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(241, 245, 249, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
  },
  currentPhotoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoOptionsContainer: {
    padding: 16,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 14,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  photoOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(109, 40, 217, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  photoOptionText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
  },
  removePhotoOption: {
    borderBottomWidth: 0,
    marginBottom: 5,
    backgroundColor: 'rgba(254, 242, 242, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  removePhotoIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  removePhotoText: {
    color: COLORS.error,
    fontWeight: '600',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(79, 70, 229, 0.9)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    zIndex: 5, // Ensure it's above everything
  },
  // Full photo view modal styles
  fullPhotoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullSizePhoto: {
    width: '100%',
    height: '80%',
  },
  fullPhotoCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullScreenBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

});
export default StudentDashboard;