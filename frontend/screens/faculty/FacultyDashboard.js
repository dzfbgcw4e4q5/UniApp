import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Linking,
  Image,
  Pressable
} from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import { IP } from '../../ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
// ...existing code...
import DateTimePicker from '@react-native-community/datetimepicker';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import * as ImagePicker from 'expo-image-picker';

const Drawer = createDrawerNavigator();
const { width, height } = Dimensions.get('window');

// Animated Card Component
const AnimatedCard = ({ children, delay = 0, style }) => {
  const translateY = new Animated.Value(50);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Example: Unified color palette (replace with your actual palette)
const COLORS = {
  primary: '#2563eb', // blue-600
  secondary: '#f1f5f9', // slate-100
  accent: '#22d3ee', // cyan-400
  background: '#f8fafc', // slate-50
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  danger: '#ef4444',
  success: '#22c55e',
  sidebar: '#1e293b', // dark sidebar
  sidebarActive: '#2563eb',
  sidebarInactive: '#cbd5e1',
};
const HomeScreen = ({ navigation, facultyProfile }) => {
  const [tasks, setTasks] = useState([]);
  const [selfTasks, setSelfTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selfTaskModalVisible, setSelfTaskModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'self'
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentTimeState, setCurrentTimeState] = useState('');
  const [currentDateState, setCurrentDateState] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    student_id: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium', // Default priority
  });
  const [newSelfTask, setNewSelfTask] = useState({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium', // Default priority
  });

  // ...existing code...

  // Initial data fetch and set up periodic refresh
  useEffect(() => {
    console.log('Faculty HomeScreen mounted, initial data fetch');
    // Initial fetch
    fetchData();
    // Set up interval to refresh tasks every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing tasks...');
      fetchTasks();
    }, 30000); // 30 seconds
    // Clean up interval on component unmount
    return () => {
      console.log('Faculty HomeScreen unmounted, clearing interval');
      clearInterval(refreshInterval);
    };
  }, []);
  
  // Update time and date
  useEffect(() => {
    // Function to update the time and date
    const updateDateTime = () => {
      const now = new Date();
      
      // Update time
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedHour = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const timeString = `${formattedHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      setCurrentTimeState(timeString);
      
      // Update date
      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      const dateString = now.toLocaleDateString('en-US', options);
      setCurrentDateState(dateString);
    };
    
    // Update immediately
    updateDateTime();
    
    // Set interval to update every minute
    const intervalId = setInterval(updateDateTime, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Faculty dashboard in focus, refreshing data...');
      fetchData();
      return () => {
        console.log('Faculty dashboard lost focus');
      };
    }, [])
  );

  const fetchData = async () => {
    console.log('Fetching all faculty dashboard data...');
    try {
      setIsLoading(true);
      // Check token first to avoid multiple login prompts
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        Alert.alert('Session Expired', 'Please login again');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      // Use Promise.all for parallel requests (no profile fetch here)
      try {
        await Promise.all([
          fetchTasks('assigned'),
          fetchTasks('self'),
          fetchStudents()
        ]);
        console.log('Successfully fetched all faculty dashboard data');
      } catch (err) {
        console.error('Error in one of the fetch operations:', err);
        // Continue execution even if one request fails
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show alert on every error to avoid annoying the user
      if (!refreshing) {
        Alert.alert('Error', 'Failed to load data. Please check your network connection and try again.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      console.log('Finished fetching all faculty dashboard data');
    }
  };

  // Removed fetchProfile and profile state; use facultyProfile from props

  const fetchTasks = async (type = 'assigned') => {
    try {
      console.log(`Fetching latest ${type} tasks for faculty dashboard...`);
      const token = await AsyncStorage.getItem('token');
      
      // Add a timestamp parameter to prevent caching
      const response = await axios.get(`http://${IP}:3000/api/faculty/tasks?type=${type}&timestamp=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      
      console.log(`Fetched ${response.data.length} ${type} tasks with statuses:`, 
        response.data.map(t => `${t.id}: ${t.status}`).join(', '));
      
      if (response.data.length > 0) {
        console.log(`First ${type} task details:`, JSON.stringify(response.data[0], null, 2));
      }
      
      if (type === 'self') {
        setSelfTasks(response.data);
      } else {
        setTasks(response.data);
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} tasks:`, error);
      // Don't throw the error, just return an empty array
      if (type === 'self') {
        setSelfTasks([]);
      } else {
        setTasks([]);
      }
      return [];
    }
  };

  const fetchStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`http://${IP}:3000/api/faculty/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      // Don't throw the error, just return an empty array
      setStudents([]);
      return [];
    }
  };

  const onRefresh = useCallback(() => {
    console.log('Home screen refresh triggered');
    setRefreshing(true);
    // Add a small delay to ensure the refresh spinner is visible
    setTimeout(() => {
      fetchData();
    }, 100);
  }, []);

  const assignTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    if (!newTask.description.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }
    if (!newTask.student_id) {
      Alert.alert('Error', 'Please select a student to assign the task');
      return;
    }
    if (!newTask.due_date) {
      Alert.alert('Error', 'Please enter a due date');
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `http://${IP}:3000/api/faculty/assign-task`,
        {
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          student_id: parseInt(newTask.student_id),
          due_date: newTask.due_date,
          priority: newTask.priority
        },
        { 
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        Alert.alert(
          'Success',
          'Task assigned successfully',
          [{ text: 'OK', onPress: () => {
            setModalVisible(false);
            setNewTask({
              title: '',
              description: '',
              student_id: '',
              due_date: new Date().toISOString().split('T')[0],
              priority: 'medium',
            });
            fetchTasks('assigned');
          }}]
        );
      }
    } catch (error) {
      console.error('Error assigning task:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to assign task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const assignSelfTask = async () => {
    if (!newSelfTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    if (!newSelfTask.description.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }
    if (!newSelfTask.due_date) {
      Alert.alert('Error', 'Please enter a due date');
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `http://${IP}:3000/api/faculty/assign-self-task`,
        {
          title: newSelfTask.title.trim(),
          description: newSelfTask.description.trim(),
          due_date: newSelfTask.due_date,
          priority: newSelfTask.priority
        },
        { 
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        Alert.alert(
          'Success',
          'Task assigned to yourself successfully',
          [{ text: 'OK', onPress: () => {
            setSelfTaskModalVisible(false);
            setNewSelfTask({
              title: '',
              description: '',
              due_date: new Date().toISOString().split('T')[0],
              priority: 'medium',
            });
            fetchTasks('self');
          }}]
        );
      }
    } catch (error) {
      console.error('Error assigning self task:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to assign task to yourself. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update task status (for self-assigned tasks)
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      let endpoint;
      let requestBody = {};
      
      if (newStatus === 'completed') {
        // Use the specific complete endpoint for backward compatibility
        endpoint = `http://${IP}:3000/api/faculty/self-tasks/${taskId}/complete`;
      } else {
        // Use the general status update endpoint
        endpoint = `http://${IP}:3000/api/faculty/self-tasks/${taskId}/status`;
        requestBody = { status: newStatus };
      }
      
      const response = await axios.patch(endpoint, requestBody, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const statusMessages = {
          'pending': 'Task status changed to pending',
          'in_progress': 'Task started successfully',
          'completed': 'Task completed successfully'
        };
        
        Alert.alert(
          'Success',
          statusMessages[newStatus] || 'Task status updated successfully',
          [{ text: 'OK', onPress: () => {
            setTaskDetailModalVisible(false);
            fetchTasks('self'); // Refresh the tasks
          }}]
        );
      }
    } catch (error) {
      console.error('Error updating task status:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update task status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setNewTask({ ...newTask, due_date: formattedDate });
    }
  };

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { bg: '#dcfce7', text: '#16a34a', icon: 'check-circle' };
      case 'in progress':
        return { bg: '#dbeafe', text: '#3b82f6', icon: 'autorenew' };
      case 'pending':
        return { bg: '#fef9c3', text: '#ca8a04', icon: 'schedule' };
      default:
        return { bg: '#f3f4f6', text: '#64748b', icon: 'help-outline' };
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const renderTask = ({ item, index }) => {
    const statusStyle = getStatusStyle(item.status);
    const dueDate = new Date(item.due_date);
    const isOverdue = dueDate < new Date() && item.status.toLowerCase() !== 'completed';

    // Helper to get initials from name
    const getInitials = (name) => {
      if (!name) return '';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0][0].toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
      <AnimatedCard delay={index * 100} style={styles.taskCard}>
        <TouchableOpacity
          onPress={async () => {
            console.log('Selected task ID:', item.id);
            try {
              // Fetch the latest task details from the server
              const token = await AsyncStorage.getItem('token');
              const response = await axios.get(`http://${IP}:3000/api/faculty/tasks/${item.id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Cache-Control': 'no-cache'
                }
              });
              console.log('Fetched task details:', JSON.stringify(response.data, null, 2));
              setSelectedTask(response.data);
            } catch (error) {
              console.error('Error fetching task details:', error);
              // Fall back to the list item data if fetch fails
              console.log('Using list data instead:', JSON.stringify(item, null, 2));
              setSelectedTask(item);
            }
            setTaskDetailModalVisible(true);
          }}
          onLongPress={() => {
            // Quick status change for self-assigned tasks
            if (activeTab === 'self') {
              const currentStatus = item.status.toLowerCase();
              let quickActions = [];
              
              if (currentStatus === 'pending') {
                quickActions = [
                  { text: 'Start Task', onPress: () => updateTaskStatus(item.id, 'in_progress') },
                  { text: 'Mark Complete', onPress: () => updateTaskStatus(item.id, 'completed') }
                ];
              } else if (currentStatus === 'in_progress') {
                quickActions = [
                  { text: 'Pause Task', onPress: () => updateTaskStatus(item.id, 'pending') },
                  { text: 'Mark Complete', onPress: () => updateTaskStatus(item.id, 'completed') }
                ];
              } else if (currentStatus === 'completed') {
                quickActions = [
                  { text: 'Reopen Task', onPress: () => updateTaskStatus(item.id, 'pending') }
                ];
              }
              
              quickActions.push({ text: 'Cancel', style: 'cancel' });
              
              Alert.alert(
                'Quick Actions',
                `Change status for "${item.title}"`,
                quickActions
              );
            }
          }}
        >
          <View style={styles.taskCardHeader}>
            <View style={[styles.taskStatusBadge, { backgroundColor: statusStyle.bg }]}> 
              <MaterialIcons name={statusStyle.icon} size={16} color={statusStyle.text} />
              <Text style={[styles.taskStatusText, { color: statusStyle.text }]}> 
                {item.status}
              </Text>
            </View>
            {isOverdue && (
              <View style={styles.overdueTag}>
                <MaterialIcons name="warning" size={14} color="#ef4444" />
                <Text style={styles.overdueText}>Overdue</Text>
              </View>
            )}
          </View>

          <Text style={styles.taskCardTitle}>{item.title}</Text>

          <Text style={styles.taskCardDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.taskCardFooter}>
            <View style={styles.taskCardInfoContainer}>
              <View style={styles.taskCardInfo}>
                <MaterialIcons name="event" size={16} color="#64748b" />
                <Text style={styles.taskCardInfoText}>
                  Due: {dueDate.toLocaleDateString()}
                </Text>
              </View>

              <View style={[styles.taskCardInfo, { flexDirection: 'row', alignItems: 'center' }]}> 
                {activeTab !== 'self' && (
                  item.student_photo ? (
                    <Image
                      source={{ uri: item.student_photo }}
                      style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: '#e0e7ef' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: '#e0e7ef', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#2563eb', fontWeight: 'bold', fontSize: 14 }}>{getInitials(item.student_name)}</Text>
                    </View>
                  )
                )}
                <MaterialIcons
                  name={activeTab === 'self' ? "person" : "school"}
                  size={16}
                  color="#64748b"
                />
                <Text style={styles.taskCardInfoText}>
                  {activeTab === 'self' ? 'Self-assigned' : item.student_name}
                </Text>
              </View>
            </View>

            <View style={styles.taskMetaIcons}>
              {item.notes && (
                <View style={styles.taskMetaIcon}>
                  <MaterialIcons name="note" size={16} color="#0ea5e9" />
                </View>
              )}
              {item.link && (
                <View style={styles.taskMetaIcon}>
                  <MaterialIcons name="link" size={16} color="#0ea5e9" />
                </View>
              )}
              <MaterialIcons name="chevron-right" size={20} color="#0ea5e9" />
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
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
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  // Get current date for greeting
  const currentHour = new Date().getHours();
  let greeting = "Good Morning";
  if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good Afternoon";
  } else if (currentHour >= 17) {
    greeting = "Good Evening";
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Chat Modal removed */}
      
      <View style={styles.header}>
        <TouchableOpacity
          style={{ marginRight: 16 }}
          onPress={() => navigation.openDrawer()}
        >
          <MaterialIcons name="menu" size={32} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity
          style={styles.chatIconButton}
          onPress={() => navigation.navigate('ChatListScreen')}
        >
          <MaterialIcons name="chat" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Task Type Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'assigned' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('assigned')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'assigned' && styles.activeTabButtonText
          ]}>
            Student Tasks
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'self' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('self')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'self' && styles.activeTabButtonText
          ]}>
            My Tasks
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <AnimatedCard delay={100} style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="assignment" size={24} color="#0ea5e9" />
          </View>
          <Text style={styles.statValue}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </AnimatedCard>
        
        <AnimatedCard delay={200} style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="school" size={24} color="#0ea5e9" />
          </View>
          <Text style={styles.statValue}>{students.length}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </AnimatedCard>
        
        <AnimatedCard delay={300} style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="check-circle" size={24} color="#0ea5e9" />
          </View>
          <Text style={styles.statValue}>
            {tasks.filter(task => task.status.toLowerCase() === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </AnimatedCard>
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'all' && styles.filterButtonTextActive
            ]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'pending' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('pending')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'pending' && styles.filterButtonTextActive
            ]}>Pending</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'in progress' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('in progress')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'in progress' && styles.filterButtonTextActive
            ]}>In Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'completed' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('completed')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'completed' && styles.filterButtonTextActive
            ]}>Completed</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <FlatList
        data={activeTab === 'assigned' ? filteredTasks : selfTasks.filter(task => {
          if (filterStatus === 'all') return true;
          return task.status.toLowerCase() === filterStatus.toLowerCase();
        })}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.tasksList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => {
              setRefreshing(true);
              if (activeTab === 'assigned') {
                onRefresh();
              } else {
                fetchTasks('self').finally(() => setRefreshing(false));
              }
            }} 
            colors={['#0ea5e9']} 
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <MaterialIcons name="assignment" size={60} color="#d1d5db" />
            <Text style={styles.emptyListText}>
              {activeTab === 'assigned' ? 'No student tasks available' : 'No self-assigned tasks available'}
            </Text>
            <Text style={styles.emptyListSubText}>
              {filterStatus !== 'all' 
                ? `No ${filterStatus} ${activeTab === 'assigned' ? 'student' : 'self-assigned'} tasks found. Try changing the filter.` 
                : `Create a new ${activeTab === 'assigned' ? 'student' : 'self-assigned'} task by tapping the button below`}
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          if (activeTab === 'assigned') {
            setModalVisible(true);
          } else {
            // For self-assigned tasks
            setNewSelfTask({
              title: '',
              description: '',
              due_date: new Date().toISOString().split('T')[0],
              priority: 'medium',
            });
            setSelfTaskModalVisible(true);
          }
        }}
      >
        <MaterialIcons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
      
      {/* Task Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={taskDetailModalVisible}
        onRequestClose={() => setTaskDetailModalVisible(false)}
      >
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(30,41,59,0.35)'}}>
          <View style={{width:'92%', backgroundColor:'#fff', borderRadius:22, padding:0, overflow:'hidden', shadowColor:'#2563eb', shadowOpacity:0.12, shadowRadius:16, elevation:8}}>
            {/* Modal Header */}
            <View style={{backgroundColor:COLORS.primary, flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:18, borderTopLeftRadius:22, borderTopRightRadius:22}}>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <MaterialIcons name="assignment" size={26} color="#fff" style={{marginRight:8}} />
                <Text style={{fontSize:20, fontWeight:'bold', color:'#fff'}} numberOfLines={1} ellipsizeMode="tail">{selectedTask?.title || 'Task Details'}</Text>
              </View>
              <TouchableOpacity onPress={() => setTaskDetailModalVisible(false)}>
                <MaterialIcons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
            {selectedTask && (
              <ScrollView style={{padding:22}}>
                {/* Due Date & Assigned To */}
                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:18}}>
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <MaterialIcons name="event" size={20} color={COLORS.primary} style={{marginRight:6}} />
                    <Text style={{fontSize:15, color:COLORS.text, fontWeight:'500'}}>Due: {new Date(selectedTask.due_date).toLocaleDateString()}</Text>
                  </View>
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <MaterialIcons name={activeTab==='self'?"person":"school"} size={20} color={COLORS.primary} style={{marginRight:6}} />
                    <Text style={{fontSize:15, color:COLORS.text, fontWeight:'500'}}>{activeTab==='self'?'Self-assigned':selectedTask.student_name}</Text>
                  </View>
                </View>
                {/* Status */}
                <View style={{marginBottom:18}}>
                  <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Status</Text>
                  <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                    {(() => {
                      const statusStyle = getStatusStyle(selectedTask.status);
                      return (
                        <View style={{flexDirection:'row', alignItems:'center', backgroundColor:statusStyle.bg, borderRadius:8, paddingHorizontal:12, paddingVertical:5}}>
                          <MaterialIcons name={statusStyle.icon} size={20} color={statusStyle.text} />
                          <Text style={{color:statusStyle.text, fontWeight:'bold', marginLeft:6}}>{selectedTask.status}</Text>
                        </View>
                      );
                    })()}
                    
                    {/* Status Change Buttons for Self-Assigned Tasks */}
                    {activeTab === 'self' && (
                      <View style={{flexDirection:'row', alignItems:'center', flexWrap:'wrap'}}>
                        {selectedTask.status.toLowerCase() === 'pending' && (
                          <TouchableOpacity
                            style={{
                              backgroundColor:'#dbeafe',
                              borderRadius:8,
                              paddingHorizontal:12,
                              paddingVertical:6,
                              flexDirection:'row',
                              alignItems:'center',
                              marginRight:8,
                              marginBottom:4
                            }}
                            onPress={() => updateTaskStatus(selectedTask.id, 'in_progress')}
                            disabled={isLoading}
                          >
                            <MaterialIcons name="play-arrow" size={16} color="#3b82f6" />
                            <Text style={{color:'#3b82f6', fontWeight:'600', marginLeft:4}}>Start</Text>
                          </TouchableOpacity>
                        )}
                        
                        {selectedTask.status.toLowerCase() === 'in_progress' && (
                          <TouchableOpacity
                            style={{
                              backgroundColor:'#fef9c3',
                              borderRadius:8,
                              paddingHorizontal:12,
                              paddingVertical:6,
                              flexDirection:'row',
                              alignItems:'center',
                              marginRight:8,
                              marginBottom:4
                            }}
                            onPress={() => updateTaskStatus(selectedTask.id, 'pending')}
                            disabled={isLoading}
                          >
                            <MaterialIcons name="pause" size={16} color="#ca8a04" />
                            <Text style={{color:'#ca8a04', fontWeight:'600', marginLeft:4}}>Pause</Text>
                          </TouchableOpacity>
                        )}
                        
                        {selectedTask.status.toLowerCase() !== 'completed' && (
                          <TouchableOpacity
                            style={{
                              backgroundColor:'#dcfce7',
                              borderRadius:8,
                              paddingHorizontal:12,
                              paddingVertical:6,
                              flexDirection:'row',
                              alignItems:'center',
                              marginBottom:4
                            }}
                            onPress={() => updateTaskStatus(selectedTask.id, 'completed')}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <ActivityIndicator size="small" color="#16a34a" />
                            ) : (
                              <>
                                <MaterialIcons name="check-circle" size={16} color="#16a34a" />
                                <Text style={{color:'#16a34a', fontWeight:'600', marginLeft:4}}>Complete</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                        
                        {selectedTask.status.toLowerCase() === 'completed' && (
                          <View style={{
                            backgroundColor:'#dcfce7',
                            borderRadius:8,
                            paddingHorizontal:12,
                            paddingVertical:6,
                            flexDirection:'row',
                            alignItems:'center',
                            marginBottom:4
                          }}>
                            <MaterialIcons name="check-circle" size={16} color="#16a34a" />
                            <Text style={{color:'#16a34a', fontWeight:'600', marginLeft:4}}>Task Completed</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
                {/* Description */}
                <View style={{marginBottom:18}}>
                  <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Description</Text>
                  <Text style={{fontSize:15, color:COLORS.text, backgroundColor:'#f1f5f9', borderRadius:10, padding:12}}>{selectedTask.description}</Text>
                </View>
                {/* Notes */}
                <View style={{marginBottom:18}}>
                  <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Student Notes</Text>
                  {selectedTask.notes ? (
                    <Text style={{fontSize:15, color:COLORS.text, backgroundColor:'#f1f5f9', borderRadius:10, padding:12}}>{selectedTask.notes}</Text>
                  ) : (
                    <Text style={{color:COLORS.muted, fontStyle:'italic'}}>No notes provided by student</Text>
                  )}
                </View>
                {/* Link */}
                <View style={{marginBottom:18}}>
                  <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Resource Link</Text>
                  {selectedTask.link && selectedTask.link !== 'null' ? (
                    <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#f1f5f9', borderRadius:10, padding:12}}>
                      <MaterialIcons name="link" size={20} color={COLORS.primary} style={{marginRight:6}} />
                      <Text style={{flex:1, color:COLORS.text}} numberOfLines={1} ellipsizeMode="middle">{selectedTask.link}</Text>
                      <TouchableOpacity 
                        style={{marginLeft:10, backgroundColor:COLORS.primary, borderRadius:6, paddingHorizontal:10, paddingVertical:6, flexDirection:'row', alignItems:'center'}}
                        onPress={() => {
                          let url = selectedTask.link;
                          if (!/^https?:\/\//i.test(url)) {
                            url = 'https://' + url;
                          }
                          Linking.openURL(url).catch(err => {
                            Alert.alert('Error', 'Could not open the link. Please check the URL.');
                          });
                        }}
                      >
                        <MaterialIcons name="open-in-new" size={18} color="#fff" />
                        <Text style={{color:'#fff', fontWeight:'bold', marginLeft:4}}>Open</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={{color:COLORS.muted, fontStyle:'italic'}}>No link provided by student</Text>
                  )}
                </View>
                {/* Close Button */}
                <View style={{flexDirection:'row', justifyContent:'flex-end', marginTop:10}}>
                  <TouchableOpacity
                    style={{paddingVertical:12, paddingHorizontal:22, borderRadius:8, backgroundColor:COLORS.primary}}
                    onPress={() => setTaskDetailModalVisible(false)}
                  >
                    <Text style={{color:'#fff', fontWeight:'bold', fontSize:16}}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Create Task Modal - Improved UI */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(30,41,59,0.35)'}}>
          <View style={{width:'92%', backgroundColor:'#fff', borderRadius:22, padding:0, overflow:'hidden', shadowColor:'#2563eb', shadowOpacity:0.12, shadowRadius:16, elevation:8}}>
            {/* Modal Header */}
            <View style={{backgroundColor:COLORS.primary, flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:18, borderTopLeftRadius:22, borderTopRightRadius:22}}>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <MaterialIcons name="assignment-add" size={26} color="#fff" style={{marginRight:8}} />
                <Text style={{fontSize:20, fontWeight:'bold', color:'#fff'}}>Assign New Task</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{padding:22}}>
              {/* Task Title Input */}
              <View style={{marginBottom:16}}>
                <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Task Title</Text>
                <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#f1f5f9', borderRadius:10, paddingHorizontal:12}}>
                  <MaterialIcons name="title" size={20} color={COLORS.muted} style={{marginRight:6}} />
                  <TextInput
                    style={{flex:1, fontSize:16, color:COLORS.text, paddingVertical:10}}
                    placeholder="Enter a descriptive title"
                    placeholderTextColor="#94a3b8"
                    value={newTask.title}
                    onChangeText={(text) => setNewTask({ ...newTask, title: text })}
                  />
                </View>
              </View>
              {/* Task Description Input */}
              <View style={{marginBottom:16}}>
                <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Task Description</Text>
                <View style={{flexDirection:'row', alignItems:'flex-start', backgroundColor:'#f1f5f9', borderRadius:10, paddingHorizontal:12}}>
                  <MaterialIcons name="description" size={20} color={COLORS.muted} style={{marginTop:10, marginRight:6}} />
                  <TextInput
                    style={{flex:1, fontSize:16, color:COLORS.text, paddingVertical:10, minHeight:60}}
                    placeholder="Provide detailed instructions"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                    value={newTask.description}
                    onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                  />
                </View>
              </View>
              {/* Due Date Picker */}
              <View style={{marginBottom:16}}>
                <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Due Date</Text>
                <TouchableOpacity
                  style={{flexDirection:'row', alignItems:'center', backgroundColor:'#f1f5f9', borderRadius:10, paddingHorizontal:12, paddingVertical:10}}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={20} color={COLORS.muted} style={{marginRight:6}} />
                  <Text style={{fontSize:16, color:COLORS.text}}>
                    {newTask.due_date || 'Select due date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(newTask.due_date)}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>
              {/* Student Selection */}
              <View style={{marginBottom:16}}>
                <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Assign To</Text>
                <View style={{backgroundColor:'#f1f5f9', borderRadius:10, paddingHorizontal:12}}>
                  <Picker
                    selectedValue={newTask.student_id}
                    onValueChange={(itemValue) => setNewTask({ ...newTask, student_id: itemValue })}
                    style={{fontSize:16, color:COLORS.text}}
                  >
                    <Picker.Item label="Select Student" value="" />
                    {students.map((student) => (
                      <Picker.Item
                        key={student.id}
                        label={student.name}
                        value={student.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              {/* Priority Selection */}
              <View style={{marginBottom:18}}>
                <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Priority</Text>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                  <TouchableOpacity 
                    style={{flex:1, flexDirection:'row', alignItems:'center', backgroundColor:newTask.priority==='low'?'#dcfce7':'#f1f5f9', borderRadius:8, padding:10, marginRight:6, borderWidth:newTask.priority==='low'?2:0, borderColor:'#10b981'}}
                    onPress={() => setNewTask({ ...newTask, priority: 'low' })}
                  >
                    <MaterialIcons name="flag" size={18} color="#10b981" style={{marginRight:4}} />
                    <Text style={{color:'#10b981', fontWeight:'600'}}>Low</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{flex:1, flexDirection:'row', alignItems:'center', backgroundColor:newTask.priority==='medium'?'#fef9c3':'#f1f5f9', borderRadius:8, padding:10, marginHorizontal:3, borderWidth:newTask.priority==='medium'?2:0, borderColor:'#f59e0b'}}
                    onPress={() => setNewTask({ ...newTask, priority: 'medium' })}
                  >
                    <MaterialIcons name="flag" size={18} color="#f59e0b" style={{marginRight:4}} />
                    <Text style={{color:'#f59e0b', fontWeight:'600'}}>Medium</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{flex:1, flexDirection:'row', alignItems:'center', backgroundColor:newTask.priority==='high'?'#fee2e2':'#f1f5f9', borderRadius:8, padding:10, marginLeft:6, borderWidth:newTask.priority==='high'?2:0, borderColor:'#ef4444'}}
                    onPress={() => setNewTask({ ...newTask, priority: 'high' })}
                  >
                    <MaterialIcons name="flag" size={18} color="#ef4444" style={{marginRight:4}} />
                    <Text style={{color:'#ef4444', fontWeight:'600'}}>High</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Action Buttons */}
              <View style={{flexDirection:'row', justifyContent:'flex-end', marginTop:10}}>
                <TouchableOpacity
                  style={{paddingVertical:12, paddingHorizontal:22, borderRadius:8, backgroundColor:'#f1f5f9', marginRight:10}}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{color:COLORS.muted, fontWeight:'bold', fontSize:16}}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{paddingVertical:12, paddingHorizontal:22, borderRadius:8, backgroundColor:COLORS.primary}}
                  onPress={assignTask}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{color:'#fff', fontWeight:'bold', fontSize:16}}>Assign Task</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Self Task Modal - Modern UI */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selfTaskModalVisible}
        onRequestClose={() => setSelfTaskModalVisible(false)}
      >
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(30,41,59,0.35)'}}>
          <View style={{width:'92%', backgroundColor:'#fff', borderRadius:22, padding:0, overflow:'hidden', shadowColor:'#2563eb', shadowOpacity:0.12, shadowRadius:16, elevation:8}}>
            {/* Modal Header */}
            <View style={{backgroundColor:COLORS.primary, flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:18, borderTopLeftRadius:22, borderTopRightRadius:22}}>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <MaterialIcons name="assignment-ind" size={26} color="#fff" style={{marginRight:8}} />
                <Text style={{fontSize:20, fontWeight:'bold', color:'#fff'}}>Personal Task</Text>
              </View>
              <TouchableOpacity onPress={() => setSelfTaskModalVisible(false)}>
                <MaterialIcons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{padding:22}}>
              {/* Task Title Input */}
              <View style={{marginBottom:16}}>
                <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Task Title</Text>
                <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#f1f5f9', borderRadius:10, paddingHorizontal:12}}>
                  <MaterialIcons name="title" size={20} color={COLORS.muted} style={{marginRight:6}} />
                  <TextInput
                    style={{flex:1, fontSize:16, color:COLORS.text, paddingVertical:10}}
                    placeholder="What do you need to accomplish?"
                    placeholderTextColor="#94a3b8"
                    value={newSelfTask.title}
                    onChangeText={(text) => setNewSelfTask({...newSelfTask, title: text})}
                  />
                </View>
              </View>
              {/* Task Description Input */}
              <View style={{marginBottom:16}}>
                <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Description</Text>
                <View style={{flexDirection:'row', alignItems:'flex-start', backgroundColor:'#f1f5f9', borderRadius:10, paddingHorizontal:12}}>
                  <MaterialIcons name="description" size={20} color={COLORS.muted} style={{marginTop:10, marginRight:6}} />
                  <TextInput
                    style={{flex:1, fontSize:16, color:COLORS.text, paddingVertical:10, minHeight:60}}
                    placeholder="Add details about this task..."
                    placeholderTextColor="#94a3b8"
                    multiline={true}
                    numberOfLines={4}
                    value={newSelfTask.description}
                    onChangeText={(text) => setNewSelfTask({...newSelfTask, description: text})}
                  />
                </View>
              </View>
              {/* Due Date Input */}
              <View style={{marginBottom:16}}>
                <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Due Date</Text>
                <TouchableOpacity
                  style={{flexDirection:'row', alignItems:'center', backgroundColor:'#f1f5f9', borderRadius:10, paddingHorizontal:12, paddingVertical:10}}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={20} color={COLORS.muted} style={{marginRight:6}} />
                  <Text style={{fontSize:16, color:COLORS.text}}>
                    {new Date(newSelfTask.due_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(newSelfTask.due_date)}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const formattedDate = selectedDate.toISOString().split('T')[0];
                        setNewSelfTask({ ...newSelfTask, due_date: formattedDate });
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>
              {/* Priority Selection */}
              <View style={{marginBottom:18}}>
                <Text style={{fontWeight:'600', color:COLORS.primary, marginBottom:6}}>Priority</Text>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                  <TouchableOpacity 
                    style={{flex:1, flexDirection:'row', alignItems:'center', backgroundColor:newSelfTask.priority==='low'?'#dcfce7':'#f1f5f9', borderRadius:8, padding:10, marginRight:6, borderWidth:newSelfTask.priority==='low'?2:0, borderColor:'#10b981'}}
                    onPress={() => setNewSelfTask({ ...newSelfTask, priority: 'low' })}
                  >
                    <MaterialIcons name="flag" size={18} color="#10b981" style={{marginRight:4}} />
                    <Text style={{color:'#10b981', fontWeight:'600'}}>Low</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{flex:1, flexDirection:'row', alignItems:'center', backgroundColor:newSelfTask.priority==='medium'?'#fef9c3':'#f1f5f9', borderRadius:8, padding:10, marginHorizontal:3, borderWidth:newSelfTask.priority==='medium'?2:0, borderColor:'#f59e0b'}}
                    onPress={() => setNewSelfTask({ ...newSelfTask, priority: 'medium' })}
                  >
                    <MaterialIcons name="flag" size={18} color="#f59e0b" style={{marginRight:4}} />
                    <Text style={{color:'#f59e0b', fontWeight:'600'}}>Medium</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{flex:1, flexDirection:'row', alignItems:'center', backgroundColor:newSelfTask.priority==='high'?'#fee2e2':'#f1f5f9', borderRadius:8, padding:10, marginLeft:6, borderWidth:newSelfTask.priority==='high'?2:0, borderColor:'#ef4444'}}
                    onPress={() => setNewSelfTask({ ...newSelfTask, priority: 'high' })}
                  >
                    <MaterialIcons name="flag" size={18} color="#ef4444" style={{marginRight:4}} />
                    <Text style={{color:'#ef4444', fontWeight:'600'}}>High</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Action Buttons */}
              <View style={{flexDirection:'row', justifyContent:'flex-end', marginTop:10}}>
                <TouchableOpacity
                  style={{paddingVertical:12, paddingHorizontal:22, borderRadius:8, backgroundColor:'#f1f5f9', marginRight:10}}
                  onPress={() => setSelfTaskModalVisible(false)}
                >
                  <Text style={{color:COLORS.muted, fontWeight:'bold', fontSize:16}}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{paddingVertical:12, paddingHorizontal:22, borderRadius:8, backgroundColor:COLORS.primary}}
                  onPress={assignSelfTask}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{color:'#fff', fontWeight:'bold', fontSize:16}}>Create Task</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};


import FacultyProfileScreen from './FacultyProfileScreen';

function FacultyDrawerContent({
  facultyProfile,
  loading,
  uploading,
  setPhotoMenuVisible,
  photoMenuVisible,
  handleProfilePhotoUpload,
  setUploading,
  navigation,
}) {
  // Debug log for facultyProfile.photo
  console.log('Sidebar facultyProfile.photo:', facultyProfile?.photo);
  return (
    <DrawerContentScrollView style={styles.drawerContent}>
      {/* Sidebar Header */}
      <View style={styles.drawerHeader}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => setPhotoMenuVisible(true)}
          disabled={uploading}
        >
          <View style={{position:'relative', width:72, height:72, marginBottom:10}}>
            {loading || uploading ? (
              <View style={styles.drawerAvatarLoading}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : facultyProfile?.photo ? (
              <Image 
                source={{ uri: facultyProfile.photo + '?t=' + Date.now() }} 
                style={{width:72, height:72, borderRadius:36, resizeMode:'cover'}} 
              />
            ) : (
              <View style={styles.drawerAvatarPlaceholder}>
                <Text style={styles.drawerAvatarText}>
                  {facultyProfile?.name ? facultyProfile.name[0].toUpperCase() : 'F'}
                </Text>
              </View>
            )}
            <View style={[styles.cameraIconContainer, {position:'absolute', bottom:4, right:4, backgroundColor:'#2563eb', borderRadius:10, padding:2}]}> 
              <MaterialIcons name="photo-camera" size={14} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.drawerName}>{facultyProfile?.name || 'Faculty'}</Text>
        <Text style={styles.drawerRole}>Faculty</Text>
        {/* Photo Menu Modal */}
        <Modal
          transparent={true}
          visible={photoMenuVisible}
          onRequestClose={() => setPhotoMenuVisible(false)}
          animationType="fade"
        >
          <Pressable 
            style={{flex:1, backgroundColor:'rgba(30,41,59,0.45)', justifyContent:'center', alignItems:'center'}} 
            onPress={() => setPhotoMenuVisible(false)}
          >
            <View style={{width:300, backgroundColor:'#fff', borderRadius:20, overflow:'hidden', shadowColor:'#2563eb', shadowOpacity:0.15, shadowRadius:18, elevation:10}}>
              <View style={{backgroundColor:'#2563eb', paddingVertical:18, alignItems:'center', borderTopLeftRadius:20, borderTopRightRadius:20}}>
                <Text style={{color:'#fff', fontWeight:'bold', fontSize:18, letterSpacing:0.5}}>Change Profile Photo</Text>
              </View>
              <TouchableOpacity 
                style={{flexDirection:'row', alignItems:'center', paddingVertical:20, paddingHorizontal:28}}
                onPress={() => { setPhotoMenuVisible(false); handleProfilePhotoUpload(true); }}
              >
                <MaterialIcons name="camera-alt" size={26} color="#2563eb" style={{marginRight:16}} />
                <Text style={{fontSize:17, color:'#1e293b', fontWeight:'600'}}>Take Photo</Text>
              </TouchableOpacity>
              <View style={{height:1, backgroundColor:'#e5e7eb', marginHorizontal:18}} />
              <TouchableOpacity 
                style={{flexDirection:'row', alignItems:'center', paddingVertical:20, paddingHorizontal:28}}
                onPress={() => { setPhotoMenuVisible(false); handleProfilePhotoUpload(false); }}
              >
                <MaterialIcons name="photo-library" size={26} color="#2563eb" style={{marginRight:16}} />
                <Text style={{fontSize:17, color:'#1e293b', fontWeight:'600'}}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{paddingVertical:16, alignItems:'center', borderBottomLeftRadius:20, borderBottomRightRadius:20, backgroundColor:'#f1f5f9'}}
                onPress={() => setPhotoMenuVisible(false)}
              >
                <Text style={{color:'#2563eb', fontWeight:'bold', fontSize:16}}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
      <DrawerItem
        label="Dashboard"
        labelStyle={styles.drawerItemLabel}
        style={navigation?.getState?.().index === 0 ? styles.drawerItemActive : null}
        icon={({ color, size }) => <MaterialIcons name="dashboard" color="#fff" size={size} />}
        onPress={() => navigation.navigate('Home')}
      />
      <DrawerItem
        label="Tasks"
        labelStyle={styles.drawerItemLabel}
        icon={({ color, size }) => <MaterialIcons name="assignment" color="#fff" size={size} />}
        onPress={() => navigation.navigate('Home', { tab: 'assigned' })}
      />
      <DrawerItem
        label="My Tasks"
        labelStyle={styles.drawerItemLabel}
        icon={({ color, size }) => <MaterialIcons name="assignment-ind" color="#fff" size={size} />}
        onPress={() => navigation.navigate('Home', { tab: 'self' })}
      />
      <DrawerItem
        label="Tickets"
        labelStyle={styles.drawerItemLabel}
        icon={({ color, size }) => <MaterialIcons name="confirmation-number" color="#fff" size={size} />}
        onPress={() => navigation.navigate('Tickets')}
      />
      <DrawerItem
        label="Profile"
        labelStyle={styles.drawerItemLabel}
        style={navigation?.getState?.().index === 1 ? styles.drawerItemActive : null}
        icon={({ color, size }) => <MaterialIcons name="person" color="#fff" size={size} />}
        onPress={() => navigation.navigate('Profile')}
      />
      <DrawerItem
        label="Logout"
        labelStyle={styles.drawerItemLabel}
        icon={({ color, size }) => <MaterialIcons name="logout" color="#fff" size={size} />}
        onPress={async () => {
          await AsyncStorage.removeItem('token');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }}
      />
    </DrawerContentScrollView>
  );
}


const FacultyDashboard = () => {
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);

  // Fetch faculty profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`http://${IP}:3000/api/faculty/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFacultyProfile(response.data);
    } catch (error) {
      console.error('Error fetching faculty profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (useCamera = false) => {
    try {
      setPhotoMenuVisible(false);
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to take photos');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Media library permission is required to select photos');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      }
      if (result.canceled) return;
      setUploading(true);
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('photo', {
        uri: result.assets[0].uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });
      await axios.post(`http://${IP}:3000/api/faculty/upload-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchProfile();
      Alert.alert('Success', 'Profile photo updated successfully');
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Error', 'Failed to upload profile photo');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Pass shared state and handlers to both sidebar and profile screen
  return (
    <Drawer.Navigator
      drawerContent={props => (
        <FacultyDrawerContent
          {...props}
          facultyProfile={facultyProfile}
          loading={loading}
          uploading={uploading}
          setPhotoMenuVisible={setPhotoMenuVisible}
          photoMenuVisible={photoMenuVisible}
          handleProfilePhotoUpload={handleProfilePhotoUpload}
          setUploading={setUploading}
        />
      )}
      screenOptions={{
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.muted,
        drawerStyle: { backgroundColor: COLORS.sidebar, width: 260 },
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="Home"
        children={props => <HomeScreen {...props} facultyProfile={facultyProfile} />}
        options={{ drawerLabel: 'Dashboard' }}
      />
      <Drawer.Screen
        name="Profile"
        children={props => (
          <FacultyProfileScreen
            {...props}
            facultyProfile={facultyProfile}
            setFacultyProfile={setFacultyProfile}
            fetchProfile={fetchProfile}
            loading={loading}
            handleProfilePhotoUpload={handleProfilePhotoUpload}
            uploading={uploading}
          />
        )}
        options={{ drawerLabel: 'Profile' }}
      />
      <Drawer.Screen
        name="Tickets"
        component={require('./FacultyTickets').default}
        options={{ drawerLabel: 'Tickets' }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  // ...existing styles...
  // Remove unused/old modal styles if present
  // (photoMenuContainer, photoMenuItem, photoMenuText, photoMenuDivider, modalOverlay)
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  chatIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    marginLeft: 16,
  },
  // Sidebar styles
  drawerContent: {
    flex: 1,
    backgroundColor: COLORS.sidebar,
    paddingTop: 0,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.primary,
    marginBottom: 12,
  },
  drawerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
    backgroundColor: '#fff',
    // Only used for placeholder, not for <Image>
  },
  drawerAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  drawerRole: {
    color: '#e0e7ef',
    fontSize: 14,
    marginBottom: 2,
  },
  drawerItemLabel: {
    color: COLORS.sidebarInactive,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: -10,
  },
  drawerItemActive: {
    backgroundColor: COLORS.sidebarActive,
    borderRadius: 8,
  },
  // Tab styles (for Student Tasks/My Tasks)
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    backgroundColor: COLORS.secondary,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
    backgroundColor: COLORS.primary + '22',
  },
  tabButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 0.5,
  },
  activeTabButtonText: {
    color: COLORS.primary,
  },
  // Stat cards
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    width: '31%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIconContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '600',
  },
  // Floating button
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  // Modal, input, and profile styles
  // (You can further refine them to match your admin dashboard)
  // Profile screen styles
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#1e293b', // Darker color for better visibility
    fontWeight: '500', // Added font weight for better readability
  },
  profileInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfoContent: {
    flex: 1,
  },
  profileInfoLabel: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 2,
    fontWeight: '500', // Added font weight for better readability
  },
  profileInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  profileActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileActionText: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  logoutAction: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutIconContainer: {
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#ef4444',
  },
  // --- Drawer Content (update to match admin sidebar look) ---
  drawerContent: {
    flex: 1,
    backgroundColor: COLORS.sidebar,
    paddingTop: 0,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.primary,
    marginBottom: 12,
  },
  drawerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  drawerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  drawerRole: {
    color: '#e0e7ef',
    fontSize: 14,
    marginBottom: 2,
  },
  drawerItemLabel: {
    color: COLORS.sidebarInactive,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: -10,
  },
  drawerItemActive: {
    backgroundColor: COLORS.sidebarActive,
    borderRadius: 8,
  },
  // Tab styles (for Student Tasks/My Tasks)
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    backgroundColor: COLORS.secondary,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
    backgroundColor: COLORS.primary + '22',
  },
  tabButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 0.5,
  },
  activeTabButtonText: {
    color: COLORS.primary,
  },
  // Task Card Improvements
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  taskCardDescription: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 8,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  taskStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 8,
  },
  taskStatusText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  overdueText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  taskCardInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  taskCardInfoText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 3, // <-- Add a value here (e.g., 3)
  },
  taskMetaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetaIcon: {
    marginRight: 6,
  },
  // Modal, input, and profile styles
  // (You can further refine them to match your admin dashboard)
  // Profile screen styles
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#1e293b', // Darker color for better visibility
    fontWeight: '500', // Added font weight for better readability
  },
  profileInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfoContent: {
    flex: 1,
  },
  profileInfoLabel: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 2,
    fontWeight: '500', // Added font weight for better readability
  },
  profileInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  profileActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileActionText: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  logoutAction: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutIconContainer: {
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#ef4444',
  },
  // --- Drawer Content (update to match admin sidebar look) ---
  drawerContent: {
    flex: 1,
    backgroundColor: COLORS.sidebar,
    paddingTop: 0,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.primary,
    marginBottom: 12,
  },
  drawerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  drawerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  drawerRole: {
    color: '#e0e7ef',
    fontSize: 14,
    marginBottom: 2,
  },
  drawerItemLabel: {
    color: COLORS.sidebarInactive,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: -10,
  },
  drawerItemActive: {
    backgroundColor: COLORS.sidebarActive,
    borderRadius: 8,
  },
  // Tab styles (for Student Tasks/My Tasks)
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    backgroundColor: COLORS.secondary,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
    backgroundColor: COLORS.primary + '22',
  },
  tabButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 0.5,
  },
  activeTabButtonText: {
    color: COLORS.primary,
  },
  // Task Card Improvements
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  taskCardDescription: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 8,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  taskStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 8,
  },
  taskStatusText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  overdueText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  taskCardInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  taskCardInfoText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 3, // <-- Add a value here (e.g., 3)
  },
  taskMetaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetaIcon: {
    marginRight: 6,
  },
  // Modal, input, and profile styles
  // (You can further refine them to match your admin dashboard)
  // Profile screen styles
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#1e293b', // Darker color for better visibility
    fontWeight: '500', // Added font weight for better readability
  },
  profileInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfoContent: {
    flex: 1,
  },
  profileInfoLabel: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 2,
    fontWeight: '500', // Added font weight for better readability
  },
  profileInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  profileActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileActionText: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  logoutAction: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutIconContainer: {
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#ef4444',
  },
  // --- Drawer Content (update to match admin sidebar look) ---
  drawerContent: {
    flex: 1,
    backgroundColor: COLORS.sidebar,
    paddingTop: 0,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.primary,
    marginBottom: 12,
  },
  drawerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  drawerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  drawerRole: {
    color: '#e0e7ef',
    fontSize: 14,
    marginBottom: 2,
  },
  drawerItemLabel: {
    color: COLORS.sidebarInactive,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: -10,
  },
  drawerItemActive: {
    backgroundColor: COLORS.sidebarActive,
    borderRadius: 8,
  },
  // Tab styles (for Student Tasks/My Tasks)
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    backgroundColor: COLORS.secondary,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
    backgroundColor: COLORS.primary + '22',
  },
  tabButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 0.5,
  },
  activeTabButtonText: {
    color: COLORS.primary,
  },
  // Task Card Improvements
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  taskCardDescription: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 8,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  taskStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 8,
  },
  taskStatusText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  overdueText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  taskCardInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  taskCardInfoText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 3, // <-- Add a value here (e.g., 3)
  },
  taskMetaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetaIcon: {
    marginRight: 6,
  },
  // Modal, input, and profile styles
  // (You can further refine them to match your admin dashboard)
  // Profile screen styles
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#1e293b', // Darker color for better visibility
    fontWeight: '500', // Added font weight for better readability
  },
  profileInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfoContent: {
    flex: 1,
  },
  profileInfoLabel: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 2,
    fontWeight: '500', // Added font weight for better readability
  },
  profileInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  profileActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileActionText: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  logoutAction: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutIconContainer: {
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#ef4444',
  },
  // --- Drawer Content (update to match admin sidebar look) ---
  drawerContent: {
    flex: 1,
    backgroundColor: COLORS.sidebar,
    paddingTop: 0,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.primary,
    marginBottom: 12,
  },
  drawerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  drawerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  drawerRole: {
    color: '#e0e7ef',
    fontSize: 14,
    marginBottom: 2,
  },
  drawerItemLabel: {
    color: COLORS.sidebarInactive,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: -10,
  },
  drawerItemActive: {
    backgroundColor: COLORS.sidebarActive,
    borderRadius: 8,
  },
  

});
export default FacultyDashboard;