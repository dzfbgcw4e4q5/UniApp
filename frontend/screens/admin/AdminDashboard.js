import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert, SectionList,SafeAreaView,StatusBar,
  RefreshControl,
  Dimensions,
  Platform,
  Animated,
  Easing,
  TextInput,
  Image,
  BackHandler,
  Pressable
} from 'react-native';
import Constants from 'expo-constants';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons, Feather, AntDesign, SimpleLineIcons } from '@expo/vector-icons';
import axios from 'axios';
import { IP } from '../../ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

// Enhanced Theme colors with gradients
const COLORS = {
  primary: '#ffffff', // White - replaced purple
  primaryDark: '#e2e8f0',
  primaryLight: '#f8fafc',
  primaryGradient: ['#ffffff', '#f8fafc'],
  secondary: '#f97316', // Orange
  secondaryDark: '#ea580c',
  secondaryLight: '#fb923c',
  secondaryGradient: ['#f97316', '#fb923c'],
  accent: '#06b6d4', // Cyan
  accentDark: '#0891b2',
  accentLight: '#22d3ee',
  accentGradient: ['#06b6d4', '#22d3ee'],
  success: '#10b981', // Emerald
  successDark: '#059669',
  successLight: '#34d399',
  successGradient: ['#10b981', '#34d399'],
  warning: '#f59e0b', // Amber
  warningDark: '#d97706',
  warningLight: '#fbbf24',
  warningGradient: ['#f59e0b', '#fbbf24'],
  error: '#ef4444', // Red
  errorDark: '#dc2626',
  errorLight: '#f87171',
  errorGradient: ['#ef4444', '#f87171'],
  dark: '#1e293b',
  darkGradient: ['#1e293b', '#334155'],
  light: '#f8fafc',
  white: '#ffffff',
  black: 'rgba(0, 0, 0, 0.4)',
  blackSolid: '#000000',
  gray: '#64748b',
  grayDark: '#475569',
  grayLight: '#94a3b8',
  grayLighter: '#cbd5e1',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  background: '#f1f5f9',
  backgroundDark: '#e2e8f0',
  card: '#ffffff',
  cardHover: '#fafafa',
  shadow: 'rgba(0, 0, 0, 0.05)',
};

// Modern Sidebar Navigation Item Component with Animation - More Compact
const SidebarItem = ({ icon, label, isActive, onPress, badgeCount }) => {
  // Animation values for hover-like effect
  const [isPressed, setIsPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  
  // Use layout effect instead of useEffect to avoid scheduling updates during render
  useLayoutEffect(() => {
    // Only start animation if component is mounted
    let isComponentMounted = true;
    
    if (isComponentMounted) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: isPressed || isActive ? 1.02 : 1, // Reduced scale effect
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: isActive ? 3 : 0, // Reduced translation
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        })
      ]).start();
    }
    
    return () => {
      isComponentMounted = false;
    };
  }, [isPressed, isActive]);
  
  return (
    <Animated.View
      style={{
        transform: [{ scale }, { translateX }],
        marginBottom: 6, // Reduced margin
        marginHorizontal: 4,
      }}
    >
      <TouchableOpacity 
        style={[
          styles.sidebarItem, 
          isActive && styles.sidebarItemActive
        ]} 
        onPress={onPress}
        activeOpacity={0.85}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
      >
        {isActive && (
          <LinearGradient
            colors={COLORS.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sidebarActiveBackground}
          />
        )}
        
        <View style={styles.sidebarItemContent}>
          <View style={[
            styles.sidebarIconContainer,
            isActive && styles.sidebarIconContainerActive,
            isPressed && !isActive && { backgroundColor: 'rgba(100, 116, 139, 0.15)' }
          ]}>
            {icon}
          </View>
          <Text style={[
            styles.sidebarLabel,
            isActive && styles.sidebarLabelActive,
            isPressed && !isActive && { color: COLORS.primary }
          ]}>
            {String(label)}
          </Text>
        </View>
        
        {badgeCount > 0 && (
          <View style={styles.sidebarBadge}>
            <Text style={styles.sidebarBadgeText}>{String(badgeCount)}</Text>
          </View>
        )}
        
        {isActive && (
          <View style={styles.sidebarActiveIndicator} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated Card Component
const AnimatedCard = ({ children, delay = 0, style }) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    // Only start animation if component is mounted
    let isComponentMounted = true;
    
    if (isComponentMounted) {
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
    }
    
    return () => {
      isComponentMounted = false;
    };
  }, [delay]);

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

// Home Screen Component
const HomeScreen = () => {
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    tasks: 0,
    tickets: 0,
    pendingTickets: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTimeState, setCurrentTimeState] = useState('');
  const [currentDateState, setCurrentDateState] = useState('');
  
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

  const fetchDashboardData = async (isManualRefresh = false) => {
    console.log('Fetching admin dashboard data...');
    try {
      if (!isManualRefresh) setIsLoading(true);
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

      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      // Use Promise.all to fetch data in parallel
      const [usersResponse, tasksResponse, ticketsResponse] = await Promise.all([
        // Fetch users
        axios.get(`http://${IP}:3000/api/admin/users?timestamp=${timestamp}`, { headers }),
        
        // Fetch tasks
        axios.get(`http://${IP}:3000/api/admin/tasks?timestamp=${timestamp}`, { headers }),
        
        // Fetch tickets
        axios.get(`http://${IP}:3000/api/admin/tickets?timestamp=${timestamp}`, { headers })
      ]);
      
      console.log(`Fetched data: ${usersResponse.data.students.length} students, ${usersResponse.data.faculty.length} faculty, ${tasksResponse.data.length} tasks, ${ticketsResponse.data.length} tickets`);
      
      // Calculate stats
      const pendingTickets = ticketsResponse.data.filter(ticket => 
        ticket.status === 'pending'
      ).length;
      
      setStats({
        students: usersResponse.data.students.length,
        faculty: usersResponse.data.faculty.length,
        tasks: tasksResponse.data.length,
        tickets: ticketsResponse.data.length,
        pendingTickets
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show alert on every error to avoid annoying the user
      if (!refreshing) {
        Alert.alert(
          'Data Retrieval Error', 
          'Unable to load administrative dashboard data. Please check your network connection and try again.'
        );
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      console.log('Finished fetching admin dashboard data');
    }
  };

  const onRefresh = useCallback(() => {
    console.log('Manual refresh triggered');
    setRefreshing(true);
    setTimeout(() => {
      fetchDashboardData(true); // Pass true to indicate manual refresh
    }, 100);
  }, []);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      return () => {};
    }, [])
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      {/* Removed Chat button for Admin Dashboard */}
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <AnimatedCard delay={100} style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
              <MaterialIcons name="school" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{stats.students}</Text>
            <Text style={styles.statLabel}>Enrolled Students</Text>
          </AnimatedCard>
          
          <AnimatedCard delay={200} style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#e0f2fe' }]}>
              <MaterialIcons name="school" size={24} color="#0ea5e9" />
            </View>
            <Text style={styles.statValue}>{stats.faculty}</Text>
            <Text style={styles.statLabel}>Faculty Members</Text>
          </AnimatedCard>
          
          <AnimatedCard delay={300} style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#f0fdf4' }]}>
              <MaterialIcons name="assignment" size={24} color="#22c55e" />
            </View>
            <Text style={styles.statValue}>{stats.tasks}</Text>
            <Text style={styles.statLabel}>Academic Tasks</Text>
          </AnimatedCard>
        </View>

        <View style={styles.statsContainer}>
          <AnimatedCard delay={400} style={[styles.statCard, { width: '48%' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fef9c3' }]}>
              {/* Removed support/help icon for Admin Dashboard */}
            </View>
            <Text style={styles.statValue}>{stats.tickets}</Text>
            <Text style={styles.statLabel}>Student Requests</Text>
          </AnimatedCard>
          
          <AnimatedCard delay={500} style={[styles.statCard, { width: '48%' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#ffedd5' }]}>
              <MaterialIcons name="hourglass-empty" size={24} color="#f97316" />
            </View>
            <Text style={styles.statValue}>{stats.pendingTickets}</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </AnimatedCard>
        </View>


      </ScrollView>
    </SafeAreaView>
  );
};

// Users Screen Component
const UsersScreen = () => {
  const [users, setUsers] = useState({ students: [], faculty: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'students', 'faculty'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'branch'

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
      return () => {};
    }, [])
  );

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`http://${IP}:3000/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Directory Error', 'Unable to retrieve university personnel directory. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  const handleUserPress = (user, section) => {
    setSelectedUser({...user, userType: section.title.toLowerCase()});
    setModalVisible(true);
  };

  // Sort users based on the selected sort criteria
  const sortUsers = (data) => {
    return [...data].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'branch') {
        return (a.branch || '').localeCompare(b.branch || '');
      }
      return 0;
    });
  };

  // Filter users based on search query
  const filterBySearch = (item) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      (item.branch && item.branch.toLowerCase().includes(query))
    );
  };

  const renderUser = ({ item, section, index }) => {
    // Skip if it doesn't match the search query
    if (!filterBySearch(item)) return null;
    
    // Skip if it doesn't match the active tab
    if (activeTab === 'students' && section.title !== 'Students') return null;
    if (activeTab === 'faculty' && section.title !== 'Faculty') return null;

    // Determine colors based on user type
    const isStudent = section.title === 'Students';
    const colors = {
      bg: isStudent ? '#dbeafe' : '#e0f2fe',
      text: isStudent ? '#3b82f6' : '#0ea5e9',
      icon: isStudent ? '#3b82f6' : '#0ea5e9',
      statusBg: isStudent && item.profile_edit ? '#fff7ed' : '#f0fdf4',
      statusText: isStudent && item.profile_edit ? '#ea580c' : '#16a34a',
      statusIcon: isStudent && item.profile_edit ? 'hourglass-empty' : 'check-circle',
    };

    return (
      <AnimatedCard delay={index * 50} style={styles.enhancedUserCard}>
        <TouchableOpacity 
          onPress={() => handleUserPress(item, section)}
          style={styles.enhancedUserCardContent}
          activeOpacity={0.7}
        >
          <View style={[styles.enhancedUserAvatar, { backgroundColor: colors.bg }]}>
            <Text style={[styles.enhancedUserAvatarText, { color: colors.text }]}>
              {item.name?.[0] || '?'}
            </Text>
          </View>
          
          <View style={styles.enhancedUserInfo}>
            <View style={styles.enhancedUserHeader}>
              <Text style={styles.enhancedUserName}>{String(item.name)}</Text>
              {/* Priority Level for Students */}
              {isStudent && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                  <MaterialIcons name="star" size={14} color="#f59e42" />
                  <Text style={{ marginLeft: 4, color: '#f59e42', fontWeight: 'bold' }}>
                    {item.priorityLevel || 'Medium'}
                  </Text>
                </View>
              )}
              {isStudent && (
                <View style={[styles.enhancedUserBadge, { backgroundColor: colors.statusBg }]}>
                  <MaterialIcons name={colors.statusIcon} size={12} color={colors.statusText} />
                  <Text style={[styles.enhancedUserBadgeText, { color: colors.statusText }]}>
                    {item.profile_edit ? 'Edit Pending' : 'Verified'}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.enhancedUserEmail}>{String(item.email)}</Text>
            
            <View style={styles.enhancedUserMeta}>
              <View style={styles.enhancedUserMetaItem}>
                <MaterialIcons name="school" size={14} color="#64748b" />
                <Text style={styles.enhancedUserMetaText}>
                  {String(item.branch || 'No Branch')}
                </Text>
              </View>
              
              <View style={styles.enhancedUserMetaItem}>
                <MaterialIcons 
                  name={isStudent ? "person" : "person-pin"} 
                  size={14} 
                  color="#64748b" 
                />
                <Text style={styles.enhancedUserMetaText}>
                  {isStudent ? "Student" : "Faculty"}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.enhancedUserAction}>
            <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  // Prepare sections based on the active tab and sort criteria
  const getSections = () => {
    const sections = [];
    
    if (activeTab === 'all' || activeTab === 'students') {
      sections.push({ 
        title: 'Students', 
        data: sortUsers(users.students || []).filter(filterBySearch)
      });
    }
    
    if (activeTab === 'all' || activeTab === 'faculty') {
      sections.push({ 
        title: 'Faculty', 
        data: sortUsers(users.faculty || []).filter(filterBySearch)
      });
    }
    
    return sections;
  };

  // Get total count of filtered users
  const getTotalCount = () => {
    const sections = getSections();
    return sections.reduce((total, section) => total + section.data.length, 0);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Enhanced Header with Search */}
      <View style={styles.enhancedScreenHeader}>
        <View style={styles.enhancedHeaderTop}>
          <Text style={styles.enhancedScreenTitle}>Campus Directory</Text>
          <View style={styles.enhancedHeaderStats}>
            <View style={styles.enhancedStatBadge}>
              <Text style={styles.enhancedStatBadgeText}>
                {users.students?.length || 0} Students
              </Text>
            </View>
            <View style={styles.enhancedStatBadge}>
              <Text style={styles.enhancedStatBadgeText}>
                {users.faculty?.length || 0} Faculty
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.enhancedSearchContainer}>
          <MaterialIcons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.enhancedSearchInput}
            placeholder="Search by name, email, or department..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.enhancedSearchClear}
            >
              <MaterialIcons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.enhancedFilterTabs}>
          <TouchableOpacity
            style={[
              styles.enhancedFilterTab,
              activeTab === 'all' && styles.enhancedFilterTabActive
            ]}
            onPress={() => setActiveTab('all')}
          >
            <MaterialIcons 
              name="people" 
              size={16} 
              color={activeTab === 'all' ? "#3b82f6" : "#64748b"} 
            />
            <Text style={[
              styles.enhancedFilterTabText,
              activeTab === 'all' && styles.enhancedFilterTabTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.enhancedFilterTab,
              activeTab === 'students' && styles.enhancedFilterTabActive
            ]}
            onPress={() => setActiveTab('students')}
          >
            <MaterialIcons 
              name="school" 
              size={16} 
              color={activeTab === 'students' ? "#3b82f6" : "#64748b"} 
            />
            <Text style={[
              styles.enhancedFilterTabText,
              activeTab === 'students' && styles.enhancedFilterTabTextActive
            ]}>
              Students
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.enhancedFilterTab,
              activeTab === 'faculty' && styles.enhancedFilterTabActive
            ]}
            onPress={() => setActiveTab('faculty')}
          >
            <MaterialIcons 
              name="person-pin" 
              size={16} 
              color={activeTab === 'faculty' ? "#3b82f6" : "#64748b"} 
            />
            <Text style={[
              styles.enhancedFilterTabText,
              activeTab === 'faculty' && styles.enhancedFilterTabTextActive
            ]}>
              Faculty
            </Text>
          </TouchableOpacity>
          
          {/* Sort Options */}
          <View style={styles.enhancedSortContainer}>
            <Text style={styles.enhancedSortLabel}>Sort:</Text>
            <TouchableOpacity
              style={styles.enhancedSortButton}
              onPress={() => setSortBy(sortBy === 'name' ? 'branch' : 'name')}
            >
              <Text style={styles.enhancedSortButtonText}>
                {sortBy === 'name' ? 'Name' : 'Branch'}
              </Text>
              <MaterialIcons 
                name={sortBy === 'name' ? "arrow-downward" : "sort"} 
                size={14} 
                color="#3b82f6" 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Results Count */}
        {searchQuery && (
          <View style={styles.enhancedResultsCount}>
            <Text style={styles.enhancedResultsCountText}>
              Found {getTotalCount()} results for "{searchQuery}"
            </Text>
          </View>
        )}
      </View>
      
      {/* User List */}
      {isLoading && !refreshing ? (
        <View style={styles.enhancedLoaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.enhancedLoaderText}>Loading directory...</Text>
        </View>
      ) : (
        <SectionList
          sections={getSections()}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderUser}
          renderSectionHeader={({ section: { title, data } }) => (
            data.length > 0 ? (
              <View style={styles.enhancedSectionHeader}>
                <View style={styles.enhancedSectionHeaderLeft}>
                  <MaterialIcons 
                    name={title === 'Students' ? "school" : "person-pin"} 
                    size={18} 
                    color="#3b82f6" 
                  />
                  <Text style={styles.enhancedSectionTitle}>{title}</Text>
                </View>
                <View style={styles.enhancedSectionCount}>
                  <Text style={styles.enhancedSectionCountText}>
                    {data.length}
                  </Text>
                </View>
              </View>
            ) : null
          )}
          ListEmptyComponent={
            <View style={styles.enhancedEmptyContainer}>
              <MaterialIcons name="search-off" size={60} color="#cbd5e1" />
              <Text style={styles.enhancedEmptyTitle}>
                {searchQuery ? 'No matching results' : 'No users available'}
              </Text>
              <Text style={styles.enhancedEmptySubtitle}>
                {searchQuery 
                  ? 'Try adjusting your search or filters'
                  : 'Users will appear here once they are added to the system'
                }
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.enhancedEmptyButton}
                  onPress={() => {
                    setSearchQuery('');
                    setActiveTab('all');
                  }}
                >
                  <Text style={styles.enhancedEmptyButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#3b82f6']} 
              tintColor="#3b82f6"
            />
          }
          contentContainerStyle={styles.enhancedSectionListContent}
          stickySectionHeadersEnabled={true}
        />
      )}
      
      {/* Enhanced User Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.enhancedModalContainer}>
          <View style={styles.enhancedModalView}>
            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header with Close Button */}
                <View style={styles.enhancedModalHeader}>
                  <TouchableOpacity
                    style={styles.enhancedModalClose}
                    onPress={() => setModalVisible(false)}
                  >
                    <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.enhancedModalTitle}>User Profile</Text>
                  <View style={{width: 24}} />
                </View>
                
                {/* User Profile Header */}
                <View style={styles.enhancedUserProfileHeader}>
                  <View style={[
                    styles.enhancedUserProfileAvatar,
                    { 
                      backgroundColor: selectedUser.userType === 'students' 
                        ? '#dbeafe' 
                        : '#e0f2fe' 
                    }
                  ]}>
                    <Text style={[
                      styles.enhancedUserProfileAvatarText,
                      { 
                        color: selectedUser.userType === 'students' 
                          ? '#3b82f6' 
                          : '#0ea5e9' 
                      }
                    ]}>
                      {selectedUser.name?.[0] || '?'}
                    </Text>
                  </View>
                  
                  <Text style={styles.enhancedUserProfileName}>
                    {selectedUser.name}
                  </Text>
                  
                  <View style={[
                    styles.enhancedUserProfileBadge,
                    { 
                      backgroundColor: selectedUser.userType === 'students' 
                        ? '#dbeafe' 
                        : '#e0f2fe' 
                    }
                  ]}>
                    <MaterialIcons 
                      name={selectedUser.userType === 'students' ? "school" : "person-pin"} 
                      size={14} 
                      color={selectedUser.userType === 'students' ? "#3b82f6" : "#0ea5e9"} 
                    />
                    <Text style={[
                      styles.enhancedUserProfileBadgeText,
                      { 
                        color: selectedUser.userType === 'students' 
                          ? '#3b82f6' 
                          : '#0ea5e9' 
                      }
                    ]}>
                      {selectedUser.userType === 'students' ? 'Student' : 'Faculty'}
                    </Text>
                  </View>
                </View>
                
                {/* Contact Information Card */}
                <View style={styles.enhancedUserProfileCard}>
                  <View style={styles.enhancedUserProfileCardHeader}>
                    <MaterialIcons name="contact-mail" size={20} color="#3b82f6" />
                    <Text style={styles.enhancedUserProfileCardTitle}>
                      Contact Information
                    </Text>
                  </View>
                  
                  <View style={styles.enhancedUserProfileCardContent}>
                    <View style={styles.enhancedUserProfileItem}>
                      <View style={styles.enhancedUserProfileItemIcon}>
                        <MaterialIcons name="email" size={20} color="#64748b" />
                      </View>
                      <View style={styles.enhancedUserProfileItemContent}>
                        <Text style={styles.enhancedUserProfileItemLabel}>Email Address</Text>
                        <Text style={styles.enhancedUserProfileItemValue}>
                          {selectedUser.email}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.enhancedUserProfileDivider} />
                    
                    <View style={styles.enhancedUserProfileItem}>
                      <View style={styles.enhancedUserProfileItemIcon}>
                        <MaterialIcons name="business" size={20} color="#64748b" />
                      </View>
                      <View style={styles.enhancedUserProfileItemContent}>
                        <Text style={styles.enhancedUserProfileItemLabel}>Department/Branch</Text>
                        <Text style={styles.enhancedUserProfileItemValue}>
                          {selectedUser.branch || 'Not specified'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Profile Status Card (Students Only) */}
                {selectedUser.userType === 'students' && (
                  <View style={styles.enhancedUserProfileCard}>
                    <View style={styles.enhancedUserProfileCardHeader}>
                      <MaterialIcons name="verified-user" size={20} color="#3b82f6" />
                      <Text style={styles.enhancedUserProfileCardTitle}>
                        Profile Status
                      </Text>
                    </View>
                    
                    <View style={[
                      styles.enhancedUserProfileStatusCard,
                      selectedUser.profile_edit 
                        ? styles.enhancedUserProfileStatusPending 
                        : styles.enhancedUserProfileStatusComplete
                    ]}>
                      <MaterialIcons 
                        name={selectedUser.profile_edit ? "hourglass-empty" : "check-circle"} 
                        size={28} 
                        color={selectedUser.profile_edit ? "#ea580c" : "#16a34a"} 
                      />
                      <View style={styles.enhancedUserProfileStatusContent}>
                        <Text style={[
                          styles.enhancedUserProfileStatusTitle,
                          { 
                            color: selectedUser.profile_edit 
                              ? "#ea580c" 
                              : "#16a34a" 
                          }
                        ]}>
                          {selectedUser.profile_edit ? 'Profile Edit Pending' : 'Profile Verified'}
                        </Text>
                        <Text style={styles.enhancedUserProfileStatusDescription}>
                          {selectedUser.profile_edit 
                            ? 'Student has requested profile changes that need approval' 
                            : 'Student profile is up-to-date and verified'
                          }
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {/* Action Buttons */}
                <View style={styles.enhancedUserProfileActions}>
                  <TouchableOpacity
                    style={styles.enhancedUserProfileActionButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <MaterialIcons name="close" size={20} color="#ffffff" />
                    <Text style={styles.enhancedUserProfileActionButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [taskType, setTaskType] = useState('all'); // 'all', 'student', 'faculty'

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      return () => {};
    }, [])
  );

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Session Expired', 'Please login again');
        return;
      }
      
      // Get all tasks
      const response = await axios.get(`http://${IP}:3000/api/admin/tasks`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });
      
      console.log('Raw tasks data:', response.data);
      
      // Handle different possible data structures
      let tasksData = [];
      
      if (Array.isArray(response.data)) {
        tasksData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object with tasks property
        if (Array.isArray(response.data.tasks)) {
          tasksData = response.data.tasks;
        } else {
          // Extract tasks from object if needed
          const possibleTasksArray = Object.values(response.data).find(val => Array.isArray(val));
          if (possibleTasksArray) {
            tasksData = possibleTasksArray;
          }
        }
      }
      
      // Ensure each task has the required properties
      const validTasks = tasksData.map(task => ({
        id: task.id || task._id || Math.random().toString(),
        title: task.title || 'Untitled Task',
        description: task.description || 'No description provided',
        status: task.status || 'pending',
        due_date: task.due_date || task.dueDate || new Date().toISOString(),
        assigned_by: task.assigned_by || task.assignedBy || 'Faculty',
        assigned_to: task.assigned_to || task.assignedTo || 'Student',
        assigned_by_role: task.assigned_by_role || task.assignedByRole || 'faculty',
        assigned_to_role: task.assigned_to_role || task.assignedToRole || 'student',
        created_at: task.created_at || task.createdAt || new Date().toISOString(),
        task_type: task.task_type || task.taskType || 'regular',
        is_self_assigned: task.is_self_assigned || task.isSelfAssigned || false,
      }));
      
      // If no tasks are found, create some sample tasks for testing
      if (validTasks.length === 0) {
        console.log('No tasks found, creating sample tasks');
        
        // Sample student tasks (assigned by faculty to students)
        const sampleStudentTasks = [
          {
            id: '1',
            title: 'Complete Mathematics Assignment',
            description: 'Solve problems 1-20 from Chapter 5 of the textbook',
            status: 'pending',
            due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            assigned_by: 'Dr. Smith',
            assigned_to: 'John Doe',
            assigned_by_role: 'faculty',
            assigned_to_role: 'student',
            created_at: new Date().toISOString(),
            task_type: 'student',
            is_self_assigned: false
          },
          {
            id: '2',
            title: 'Physics Lab Report',
            description: 'Write a detailed report on the experiment conducted in last week\'s lab session',
            status: 'in progress',
            due_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
            assigned_by: 'Prof. Johnson',
            assigned_to: 'Jane Smith',
            assigned_by_role: 'faculty',
            assigned_to_role: 'student',
            created_at: new Date().toISOString(),
            task_type: 'student',
            is_self_assigned: false
          },
          {
            id: '3',
            title: 'Literature Review',
            description: 'Submit a 5-page review of the assigned novel',
            status: 'completed',
            due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            assigned_by: 'Dr. Williams',
            assigned_to: 'Michael Brown',
            assigned_by_role: 'faculty',
            assigned_to_role: 'student',
            created_at: new Date().toISOString(),
            task_type: 'student',
            is_self_assigned: false
          },
          
          // Sample faculty self-assigned tasks
          {
            id: '4',
            title: 'Grade Midterm Exams',
            description: 'Complete grading of all midterm exams for CS101',
            status: 'pending',
            due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            assigned_by: 'Self',
            assigned_to: 'Dr. Smith',
            assigned_by_role: 'faculty',
            assigned_to_role: 'faculty',
            created_at: new Date().toISOString(),
            task_type: 'faculty',
            is_self_assigned: true
          },
          {
            id: '5',
            title: 'Prepare Lecture Notes',
            description: 'Prepare lecture notes for next week\'s classes',
            status: 'in progress',
            due_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
            assigned_by: 'Self',
            assigned_to: 'Prof. Johnson',
            assigned_by_role: 'faculty',
            assigned_to_role: 'faculty',
            created_at: new Date().toISOString(),
            task_type: 'faculty',
            is_self_assigned: true
          },
          {
            id: '6',
            title: 'Department Meeting',
            description: 'Attend monthly department meeting',
            status: 'pending',
            due_date: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
            assigned_by: 'Self',
            assigned_to: 'Dr. Williams',
            assigned_by_role: 'faculty',
            assigned_to_role: 'faculty',
            created_at: new Date().toISOString(),
            task_type: 'faculty',
            is_self_assigned: true
          },
          {
            id: '7',
            title: 'Research Paper Review',
            description: 'Review research papers for upcoming conference',
            status: 'completed',
            due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            assigned_by: 'Self',
            assigned_to: 'Dr. Brown',
            assigned_by_role: 'faculty',
            assigned_to_role: 'faculty',
            created_at: new Date().toISOString(),
            task_type: 'faculty',
            is_self_assigned: true
          }
        ];
        
        setTasks(sampleStudentTasks);
      } else {
        // Categorize tasks
        const processedTasks = validTasks.map(task => {
          // Determine if it's a student task or faculty self-assigned task
          let taskType = 'student';
          let isSelfAssigned = false;
          
          if (task.assigned_to_role === 'faculty' || 
              task.assigned_by === task.assigned_to || 
              task.is_self_assigned) {
            taskType = 'faculty';
            isSelfAssigned = true;
          }
          
          return {
            ...task,
            task_type: taskType,
            is_self_assigned: isSelfAssigned
          };
        });
        
        setTasks(processedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to fetch tasks');
      
      // Create sample tasks for testing in case of error
      const sampleTasks = [
        // Student tasks
        {
          id: '1',
          title: 'Complete Mathematics Assignment',
          description: 'Solve problems 1-20 from Chapter 5 of the textbook',
          status: 'pending',
          due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          assigned_by: 'Dr. Smith',
          assigned_to: 'John Doe',
          assigned_by_role: 'faculty',
          assigned_to_role: 'student',
          created_at: new Date().toISOString(),
          task_type: 'student',
          is_self_assigned: false
        },
        {
          id: '2',
          title: 'Physics Lab Report',
          description: 'Write a detailed report on the experiment conducted in last week\'s lab session',
          status: 'in progress',
          due_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          assigned_by: 'Prof. Johnson',
          assigned_to: 'Jane Smith',
          assigned_by_role: 'faculty',
          assigned_to_role: 'student',
          created_at: new Date().toISOString(),
          task_type: 'student',
          is_self_assigned: false
        },
        {
          id: '3',
          title: 'Literature Review',
          description: 'Submit a 5-page review of the assigned novel',
          status: 'completed',
          due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          assigned_by: 'Dr. Williams',
          assigned_to: 'Michael Brown',
          assigned_by_role: 'faculty',
          assigned_to_role: 'student',
          created_at: new Date().toISOString(),
          task_type: 'student',
          is_self_assigned: false
        },
        
        // Faculty self-assigned tasks
        {
          id: '4',
          title: 'Grade Midterm Exams',
          description: 'Complete grading of all midterm exams for CS101',
          status: 'pending',
          due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          assigned_by: 'Self',
          assigned_to: 'Dr. Smith',
          assigned_by_role: 'faculty',
          assigned_to_role: 'faculty',
          created_at: new Date().toISOString(),
          task_type: 'faculty',
          is_self_assigned: true
        },
        {
          id: '5',
          title: 'Prepare Lecture Notes',
          description: 'Prepare lecture notes for next week\'s classes',
          status: 'in progress',
          due_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          assigned_by: 'Self',
          assigned_to: 'Prof. Johnson',
          assigned_by_role: 'faculty',
          assigned_to_role: 'faculty',
          created_at: new Date().toISOString(),
          task_type: 'faculty',
          is_self_assigned: true
        }
      ];
      setTasks(sampleTasks);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, []);

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
    // First filter by task type (student/faculty)
    if (taskType !== 'all' && task.task_type !== taskType) {
      return false;
    }
    
    // Then filter by status
    if (filterStatus === 'all') return true;
    return task.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const renderTask = ({ item, index }) => {
    // Normalize status to lowercase for consistent comparison
    const status = (item.status || 'pending').toLowerCase();
    const statusStyle = getStatusStyle(status);
    
    // Handle different date formats
    let dueDate;
    try {
      dueDate = new Date(item.due_date || item.dueDate || Date.now());
    } catch (e) {
      dueDate = new Date(); // Fallback to current date if parsing fails
    }
    
    const isOverdue = dueDate < new Date() && status !== 'completed';
    
    // Format the date in a user-friendly way
    const formatDate = (date) => {
      try {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch (e) {
        return 'Invalid date';
      }
    };
    
    // Get assigned to/by names
    const assignedTo = item.assigned_to || item.assignedTo || 'Student';
    const assignedBy = item.assigned_by || item.assignedBy || 'Faculty';
    
    // Determine task type styling
    const taskTypeStyle = item.task_type === 'student' 
      ? { bg: '#dbeafe', text: '#3b82f6', icon: 'school' }  // Blue for student tasks
      : { bg: '#e0f2fe', text: '#0ea5e9', icon: 'person' }; // Light blue for faculty tasks
    
    return (
      <AnimatedCard delay={index * 50} style={styles.taskCard}>
        <TouchableOpacity 
          onPress={() => {
            setSelectedTask(item);
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.taskCardHeader}>
            {/* Task Type Badge */}
            <View style={[styles.taskTypeBadge, { backgroundColor: taskTypeStyle.bg }]}>
              <MaterialIcons name={taskTypeStyle.icon} size={16} color={taskTypeStyle.text} />
              <Text style={[styles.taskTypeText, { color: taskTypeStyle.text }]}>
                {item.task_type === 'student' ? 'Student Task' : 'Faculty Task'}
              </Text>
            </View>
            
            {/* Status Badge */}
            <View style={[styles.taskStatusBadge, { backgroundColor: statusStyle.bg }]}>
              <MaterialIcons name={statusStyle.icon} size={16} color={statusStyle.text} />
              <Text style={[styles.taskStatusText, { color: statusStyle.text }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
            
            {isOverdue && (
              <View style={styles.overdueTag}>
                <MaterialIcons name="warning" size={14} color="#ef4444" />
                <Text style={styles.overdueText}>Overdue</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.taskCardTitle}>
            {item.title || 'Untitled Task'}
          </Text>
          
          <Text style={styles.taskCardDescription} numberOfLines={2}>
            {item.description || 'No description provided'}
          </Text>
          
          <View style={styles.taskCardFooter}>
            <View style={styles.taskCardInfo}>
              <MaterialIcons name="event" size={16} color="#64748b" />
              <Text style={[styles.taskCardInfoText, isOverdue && { color: '#ef4444' }]}>
                Due: {formatDate(dueDate)}
              </Text>
            </View>
            
            <View style={styles.taskCardInfo}>
              <MaterialIcons name="person" size={16} color="#64748b" />
              <Text style={styles.taskCardInfoText}>
                Assigned to: {assignedTo}
              </Text>
            </View>
            
            <View style={styles.taskCardInfo}>
              <MaterialIcons name={item.is_self_assigned ? "person" : "school"} size={16} color="#64748b" />
              <Text style={styles.taskCardInfoText}>
                By: {item.is_self_assigned ? "Self-Assigned" : assignedBy}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Task Type Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterSectionTitle}>Task Type:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              taskType === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setTaskType('all')}
          >
            <Text style={[
              styles.filterButtonText,
              taskType === 'all' && styles.filterButtonTextActive
            ]}>All Tasks</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              taskType === 'student' && styles.filterButtonActive
            ]}
            onPress={() => setTaskType('student')}
          >
            <Text style={[
              styles.filterButtonText,
              taskType === 'student' && styles.filterButtonTextActive
            ]}>Student Tasks</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              taskType === 'faculty' && styles.filterButtonActive
            ]}
            onPress={() => setTaskType('faculty')}
          >
            <Text style={[
              styles.filterButtonText,
              taskType === 'faculty' && styles.filterButtonTextActive
            ]}>Faculty Self-Assigned</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterSectionTitle}>Status:</Text>
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
      
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.tasksList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <MaterialIcons name="assignment" size={60} color="#d1d5db" />
              <Text style={styles.emptyListText}>No tasks available</Text>
              <Text style={styles.emptyListSubText}>
                {filterStatus !== 'all' 
                  ? `No ${filterStatus} tasks found. Try changing the filter.` 
                  : 'Tasks will appear here once they are created'}
              </Text>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {selectedTask && (
              <ScrollView>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <MaterialIcons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalContent}>
                  {/* Task Type */}
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons 
                      name={selectedTask.task_type === 'student' ? 'school' : 'person'} 
                      size={20} 
                      color={selectedTask.task_type === 'student' ? '#3b82f6' : '#0ea5e9'} 
                    />
                    <Text style={[
                      styles.modalInfoText, 
                      { color: selectedTask.task_type === 'student' ? '#3b82f6' : '#0ea5e9' }
                    ]}>
                      Task Type: {selectedTask.task_type === 'student' ? 'Student Task' : 'Faculty Self-Assigned Task'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="event" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Due Date: {new Date(selectedTask.due_date).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="person" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Assigned To: {selectedTask.assigned_to} 
                      ({selectedTask.assigned_to_role || selectedTask.role || 'student'})
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons 
                      name={selectedTask.is_self_assigned ? "person" : "person-add"} 
                      size={20} 
                      color="#3b82f6" 
                    />
                    <Text style={styles.modalInfoText}>
                      Assigned By: {selectedTask.is_self_assigned ? "Self-Assigned" : selectedTask.assigned_by}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    {(() => {
                      const statusStyle = getStatusStyle(selectedTask.status);
                      return (
                        <>
                          <MaterialIcons name={statusStyle.icon} size={20} color={statusStyle.text} />
                          <Text style={[styles.modalInfoText, { color: statusStyle.text }]}>
                            Status: {selectedTask.status}
                          </Text>
                        </>
                      );
                    })()}
                  </View>
                  
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Description:</Text>
                    <Text style={styles.descriptionText}>{selectedTask.description}</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [filterType, setFilterType] = useState('profile_update'); // Focus on profile update tickets

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
      return () => {};
    }, [])
  );

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Session Expired', 'Please login again');
        return;
      }
      
      const response = await axios.get(`http://${IP}:3000/api/admin/tickets`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });
      
      // Filter to focus on profile update tickets
      const profileUpdateTickets = response.data.filter(ticket => 
        ticket.type === 'profile_update' || ticket.category === 'profile_update'
      );
      
      console.log(`Fetched ${profileUpdateTickets.length} profile update tickets`);
      setTickets(profileUpdateTickets);
    } catch (error) {
      console.error('Error fetching profile update tickets:', error);
      Alert.alert('Error', 'Failed to fetch student profile update requests');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Function to handle ticket approval
  const handleApproveTicket = async (ticketId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Session Expired', 'Please login again');
        return;
      }
      
      await axios.put(`http://${IP}:3000/api/admin/tickets/${ticketId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      Alert.alert('Success', 'Profile update request approved successfully');
      fetchTickets(); // Refresh the list
    } catch (error) {
      console.error('Error approving ticket:', error);
      Alert.alert('Error', 'Failed to approve profile update request');
    }
  };
  
  // Function to handle ticket rejection
  const handleRejectTicket = async (ticketId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Session Expired', 'Please login again');
        return;
      }
      
      await axios.put(`http://${IP}:3000/api/admin/tickets/${ticketId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      Alert.alert('Success', 'Profile update request rejected');
      fetchTickets(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting ticket:', error);
      Alert.alert('Error', 'Failed to reject profile update request');
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets();
  }, []);

  const handleTicketAction = async (ticketId, action) => {
    try {
      // Get the current user's role
      const userRole = 'admin'; // This is hardcoded since we're in the admin component
      
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `http://${IP}:3000/api/admin/profile-update-tickets/${ticketId}`,
        { 
          action,
          approved_by_type: userRole
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // Increased timeout
        }
      );
      
      // Check if the response includes updates that need to be reviewed
      if (action === 'approve' && response.data && response.data.updates) {
        // Navigate to StudentEditProfile with the required parameters
        navigation.navigate('StudentEditProfile', {
          ticketId: ticketId,
          updates: response.data.updates || {}
        });
      } else {
        // Update the ticket in the local state
        const updatedTickets = tickets.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              status: action === 'approve' ? 'approved' : 'closed',
              response: action === 'approve' 
                ? 'Profile update approved by admin' 
                : 'Profile update rejected by admin',
              approved_by_type: action === 'approve' ? userRole : null,
              // If the ticket is being approved, it's not completed yet
              // The student still needs to update their profile
              completed: false
            };
          }
          return ticket;
        });
        
        setTickets(updatedTickets);
        
        Alert.alert(
          'Success', 
          action === 'approve' 
            ? 'Ticket approved successfully. The student can now update their profile. Once they update their profile, the ticket will be marked as completed.' 
            : 'Ticket rejected successfully',
          [{ text: 'OK', onPress: () => {
            setModalVisible(false);
            // Refresh tickets to get the latest data from server
            setTimeout(() => {
              fetchTickets();
            }, 1000);
          }}]
        );
      }
    } catch (error) {
      console.error(`Error ${action}ing ticket:`, error);
      Alert.alert('Error', `Failed to ${action} ticket`);
    }
  };

  const getStatusStyle = (status, completed = false) => {
    // If the ticket is completed, override the status style
    if (completed) {
      return { bg: '#c7f7d9', text: '#059669', icon: 'check-circle' };
    }
    
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'completed':
      case 'closed':
        return { bg: '#dcfce7', text: '#16a34a', icon: 'check-circle' };
      case 'pending':
        return { bg: '#fef9c3', text: '#ca8a04', icon: 'hourglass-empty' };
      case 'approved':
        return { bg: '#dbeafe', text: '#3b82f6', icon: 'thumb-up' };
      case 'rejected':
        return { bg: '#fee2e2', text: '#ef4444', icon: 'thumb-down' };
      default:
        return { bg: '#f3f4f6', text: '#64748b', icon: 'help-outline' };
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'profile_update':
        return 'person';

      case 'academic':
        return 'school';
      case 'financial':
        return 'attach-money';
      default:
        return 'help-outline';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    let statusMatch = true;
    let typeMatch = true;
    
    if (filterStatus !== 'all') {
      if (filterStatus === 'completed') {
        // For completed filter, show only tickets that are approved and completed
        statusMatch = ticket.status === 'approved' && ticket.completed === true;
      } else {
        // For other filters, match by status
        statusMatch = ticket.status.toLowerCase() === filterStatus.toLowerCase();
      }
    }
    
    if (filterType !== 'all') {
      typeMatch = (ticket.type || 'general').toLowerCase() === filterType.toLowerCase();
    }
    
    return statusMatch && typeMatch;
  });

  const renderTicket = ({ item, index }) => {
    // Determine status display text
    let statusText = item.status;
    if (item.status === 'approved' && item.completed) {
      statusText = 'Completed';
    }
    
    const statusStyle = getStatusStyle(item.status, item.completed);
    const typeIcon = getTypeIcon(item.type);
    const date = new Date(item.created_at);
    
    return (
      <AnimatedCard delay={index * 100} style={styles.ticketCard}>
        <TouchableOpacity 
          onPress={() => {
            setSelectedTicket(item);
            setModalVisible(true);
          }}
        >
          <View style={styles.ticketCardHeader}>
            <View style={[styles.ticketStatusBadge, { 
              backgroundColor: item.completed ? '#c7f7d9' : statusStyle.bg 
            }]}>
              <MaterialIcons 
                name={item.completed ? 'check-circle' : statusStyle.icon} 
                size={16} 
                color={item.completed ? '#059669' : statusStyle.text} 
              />
              <Text style={[styles.ticketStatusText, { 
                color: item.completed ? '#059669' : statusStyle.text 
              }]}>
                {statusText}
              </Text>
            </View>
            <Text style={styles.ticketDate}>{date.toLocaleDateString()}</Text>
          </View>
          
          <Text style={styles.ticketCardTitle}>{String(item.subject || '')}</Text>
          
          <Text style={styles.ticketCardDescription} numberOfLines={2}>
            {String(item.description || '')}
          </Text>
          
          {/* Show approval information if available */}
          {(item.status === 'approved' || item.completed) && item.response && (
            <View style={styles.approvalInfoContainer}>
              <Text style={styles.approvalInfoText}>
                {item.response}
              </Text>
              {item.completed && (
                <Text style={styles.completedInfoText}>
                  Student has updated their profile
                </Text>
              )}
            </View>
          )}
          
          <View style={styles.ticketCardFooter}>
            <View style={styles.ticketCardInfo}>
              <MaterialIcons name="person" size={16} color="#64748b" />
              <Text style={styles.ticketCardInfoText}>
                {String(item.raised_by_name || '')}
              </Text>
            </View>
            
            <View style={styles.ticketCardInfo}>
              <MaterialIcons name={typeIcon} size={16} color="#64748b" />
              <Text style={styles.ticketCardInfoText}>
                {item.type ? String(item.type).replace('_', ' ') : 'General'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
            ]}>All Status</Text>
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
              filterStatus === 'approved' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('approved')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'approved' && styles.filterButtonTextActive
            ]}>Approved</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'rejected' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('rejected')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'rejected' && styles.filterButtonTextActive
            ]}>Rejected</Text>
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
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'resolved' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('resolved')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'resolved' && styles.filterButtonTextActive
            ]}>Resolved</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterType === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'all' && styles.filterButtonTextActive
            ]}>All Types</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterType === 'profile_update' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('profile_update')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'profile_update' && styles.filterButtonTextActive
            ]}>Profile Update</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterType === 'academic' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('academic')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'academic' && styles.filterButtonTextActive
            ]}>Academic</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicket}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.ticketsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <MaterialIcons name="confirmation-number" size={60} color="#d1d5db" />
              <Text style={styles.emptyListText}>No tickets available</Text>
              <Text style={styles.emptyListSubText}>
                {filterStatus !== 'all' || filterType !== 'all'
                  ? 'No tickets match your current filters. Try changing the filters.'
                  : 'Tickets will appear here once they are created'}
              </Text>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {selectedTicket && (
              <ScrollView>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{String(selectedTicket.subject)}</Text>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <MaterialIcons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalContent}>
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="person" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Raised By: {String(selectedTicket.raised_by_name)} ({String(selectedTicket.role)})
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="event" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Created: {String(new Date(selectedTicket.created_at).toLocaleString())}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name={getTypeIcon(selectedTicket.type)} size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Type: {selectedTicket.type ? String(selectedTicket.type.replace('_', ' ')) : 'General'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    {(() => {
                      const statusStyle = getStatusStyle(selectedTicket.status, selectedTicket.completed);
                      const statusText = selectedTicket.completed ? 'Completed' : selectedTicket.status;
                      return (
                        <>
                          <MaterialIcons 
                            name={selectedTicket.completed ? 'check-circle' : statusStyle.icon} 
                            size={20} 
                            color={selectedTicket.completed ? '#059669' : statusStyle.text} 
                          />
                          <Text style={[styles.modalInfoText, { 
                            color: selectedTicket.completed ? '#059669' : statusStyle.text 
                          }]}>
                            Status: {String(statusText)}
                          </Text>
                        </>
                      );
                    })()}
                  </View>
                  
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Description:</Text>
                    <Text style={styles.descriptionText}>{selectedTicket.description}</Text>
                  <Text style={styles.descriptionText}>{String(selectedTicket.description)}</Text>
                  </View>
                  
                  {selectedTicket.type === 'profile_update' && selectedTicket.requested_updates && (
                    <View style={styles.updatesContainer}>
                      <Text style={styles.updatesLabel}>Requested Updates:</Text>
                      <View style={styles.updatesBox}>
                        {(() => {
                          try {
                            // Debug logging
                            console.log('Processing requested_updates:', selectedTicket.requested_updates);
                            console.log('Type of requested_updates:', typeof selectedTicket.requested_updates);
                            
                            // Check if requested_updates exists and is valid
                            if (!selectedTicket.requested_updates) {
                              console.log('No requested_updates data available');
                              return <Text style={styles.updateError}>No update data available</Text>;
                            }
                            
                            // Check if it's a string and empty
                            if (typeof selectedTicket.requested_updates === 'string' && selectedTicket.requested_updates.trim() === '') {
                              console.log('Empty requested_updates string');
                              return <Text style={styles.updateError}>No update data available</Text>;
                            }
                            
                            // Try to parse as JSON
                            let updates;
                            if (typeof selectedTicket.requested_updates === 'string') {
                              console.log('Parsing string requested_updates');
                              updates = JSON.parse(selectedTicket.requested_updates);
                            } else if (typeof selectedTicket.requested_updates === 'object') {
                              console.log('Using object requested_updates directly');
                              updates = selectedTicket.requested_updates;
                            } else {
                              console.log('Unexpected type for requested_updates:', typeof selectedTicket.requested_updates);
                              return <Text style={styles.updateError}>Invalid update data type</Text>;
                            }
                            
                            // Validate that updates is an object
                            if (!updates || typeof updates !== 'object') {
                              return <Text style={styles.updateError}>Invalid update data format</Text>;
                            }
                            
                            // Check if object has entries
                            const entries = Object.entries(updates);
                            if (entries.length === 0) {
                              return <Text style={styles.updateInfo}>Student has requested permission to update their profile information. Specific changes will be made once approved.</Text>;
                            }
                            
                            // Check if this is a message-only update (when student requests permission)
                            if (entries.length === 1 && updates.message) {
                              return <Text style={styles.updateInfo}>{updates.message}</Text>;
                            }
                            
                            return entries.map(([key, value]) => (
                              <View key={key} style={styles.updateRow}>
                                <Text style={styles.updateKey}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</Text>
                                <Text style={styles.updateValue}>{String(value || 'N/A')}</Text>
                              </View>
                            ));
                          } catch (e) {
                            console.error('Error parsing requested updates:', e);
                            console.error('Raw data:', selectedTicket.requested_updates);
                            return (
                              <View>
                                <Text style={styles.updateError}>Unable to parse update data</Text>
                                <Text style={styles.updateErrorDetails}>
                                  Raw data: {String(selectedTicket.requested_updates).substring(0, 100)}...
                                </Text>
                              </View>
                            );
                          }
                        })()}
                      </View>
                    </View>
                  )}
                  
                  {selectedTicket.response && (
                    <View style={styles.responseContainer}>
                      <Text style={styles.responseLabel}>Response:</Text>
                      <View style={styles.responseBox}>
                        <Text style={styles.responseText}>{selectedTicket.response}</Text>
                        <Text style={styles.responseText}>{String(selectedTicket.response)}</Text>
                        
                        {selectedTicket.approved_by_type && (
                          <View style={styles.approvedByContainer}>
                            <MaterialIcons 
                              name="verified-user" 
                              size={16} 
                              color="#059669" 
                            />
                            <Text style={styles.approvedByText}>
                              Approved by: {String(selectedTicket.approved_by_type)}
                            </Text>
                          </View>
                        )}
                        
                        {selectedTicket.completed && (
                          <View style={styles.completedContainer}>
                            <MaterialIcons 
                              name="check-circle" 
                              size={16} 
                              color="#059669" 
                            />
                            <Text style={styles.completedText}>
                              Student has updated their profile
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
                
                {selectedTicket.type === 'profile_update' && selectedTicket.status === 'pending' && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleTicketAction(selectedTicket.id, 'approve')}
                    >
                      <MaterialIcons name="thumb-up" size={20} color="#ffffff" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleTicketAction(selectedTicket.id, 'reject')}
                    >
                      <MaterialIcons name="thumb-down" size={20} color="#ffffff" />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fullPhotoVisible, setFullPhotoVisible] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    pendingTickets: 0
  });

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchAdminStats();
      return () => {};
    }, [])
  );

  const fetchProfile = async () => {
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
      
      // Specifically fetch admin profile
      const response = await axios.get(`http://${IP}:3000/api/admin/profile`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });
      
      console.log('Fetched admin profile:', response.data);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      Alert.alert('Error', 'Failed to fetch admin profile information');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch admin dashboard stats
  const fetchAdminStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        return;
      }
      
      // Fetch users count
      const usersResponse = await axios.get(`http://${IP}:3000/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Fetch pending tickets count
      const ticketsResponse = await axios.get(`http://${IP}:3000/api/admin/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const pendingTickets = ticketsResponse.data.filter(ticket => 
        ticket.status === 'pending'
      ).length;
      
      setStats({
        totalUsers: usersResponse.data.students.length + usersResponse.data.faculty.length,
        totalStudents: usersResponse.data.students.length,
        totalFaculty: usersResponse.data.faculty.length,
        pendingTickets
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };
  
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
        `http://${IP}:3000/api/admin/upload-photo`,
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
        `http://${IP}:3000/api/admin/remove-photo`,
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
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
    fetchAdminStats();
  }, []);

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
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
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
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
                </Text>
              </View>
            )}
            
            {/* Camera icon overlay */}
            <View style={styles.cameraIconOverlay}>
              <MaterialIcons name="camera-alt" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{profile?.name || 'Admin'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || 'No email available'}</Text>
        </View>
        
        <AnimatedCard delay={100} style={styles.profileInfoCard}>
          <Text style={styles.profileInfoTitle}>Admin Information</Text>
          
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="badge" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Admin ID</Text>
              <Text style={styles.profileInfoValue}>{profile?.id || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="person" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Full Name</Text>
              <Text style={styles.profileInfoValue}>{profile?.name || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="email" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Email Address</Text>
              <Text style={styles.profileInfoValue}>{profile?.email || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="security" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Role</Text>
              <Text style={styles.profileInfoValue}>Administrator</Text>
            </View>
          </View>
          
          {/* Logout option removed as it's already available in the sidebar */}
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

// Main AdminDashboard Component
const AdminDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Tasks') {
            iconName = 'assignment';
            return <MaterialIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Tickets') {
            iconName = 'confirmation-number';
            return <MaterialIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          height: Platform.OS === 'ios' ? 90 : 65,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Users" component={UsersScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Tickets" component={TicketsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  // Profile Photo Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  photoModalCloseButton: {
    padding: 5,
  },
  currentPhotoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentPhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  noPhotoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    marginTop: 10,
    color: COLORS.gray,
    fontSize: 14,
  },
  photoOptionsContainer: {
    marginTop: 10,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  photoOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  photoOptionText: {
    fontSize: 16,
    color: COLORS.dark,
  },
  removePhotoOption: {
    borderBottomWidth: 0,
    marginBottom: 5,
  },
  removePhotoIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  removePhotoText: {
    color: COLORS.error,
  },
  uploadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 10,
    color: COLORS.primary,
    fontSize: 14,
  },
  fullPhotoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhotoCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullPhoto: {
    width: '90%',
    height: '70%',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(142, 68, 173, 0.9)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    zIndex: 1, // Ensure it appears above the profile image
  },
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
    width: 280, // Increased from 240 to 280
    height: '100%',
    backgroundColor: COLORS.white,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative',
  },
  logoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  appName: {
    fontSize: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  // Profile Section Styles
  sidebarProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, // Increased from 16 to 20
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    // Removed overflow: 'hidden' to allow the border to be visible
    marginRight: 15,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderWidth: 3,
    borderColor: COLORS.success, // Green border to indicate online status
    borderRadius: 40, // Make the image circular
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    borderWidth: 3,
    borderColor: COLORS.success,
    borderRadius: 40, // Ensure the placeholder has rounded corners
  },
  defaultAvatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.success,
    borderRadius: 40, // Make the avatar container circular
  },
  defaultAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 12,
    color: COLORS.gray,
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
    padding: 16,
  },
  navMenuHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 12,
    marginLeft: 4,
  },
  
  // Sidebar Item Styles
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50, // Increased from 42 to 50
    borderRadius: 10, // Increased from 8 to 10
    paddingHorizontal: 16, // Increased from 10 to 16
    marginBottom: 5, // Increased from 3 to 5
    position: 'relative',
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  sidebarItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarIconContainer: {
    width: 38, // Increased from 32 to 38
    height: 38, // Increased from 32 to 38
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14, // Increased from 10 to 14
  },
  sidebarIconContainerActive: {
    backgroundColor: 'transparent',
  },
  sidebarLabel: {
    fontSize: 15, // Increased from 13 to 15
    fontWeight: '500',
    color: COLORS.gray,
  },
  sidebarLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sidebarBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
  sidebarActiveIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  
  // Modern Logout Button - Updated Design
  logoutButton: {
    marginTop: 30,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    shadowColor: COLORS.errorDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    overflow: 'hidden',
  },
  logoutButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  logoutButtonText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  
  // Main Content Styles
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    zIndex: 1,
  },
  
  // Top Navigation Bar
  topNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  topNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hamburgerIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 2,
    backgroundColor: COLORS.dark,
    borderRadius: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  headerContent: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  topNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topNavButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    position: 'relative',
  },
  topNavBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  topNavBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Screen Content
  screenContent: {
    flex: 1,
    padding: 16,
  },
  
  // Original styles
  // Common Styles
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Constants.statusBarHeight,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  
  // Home Screen Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginRight: 10,
    marginBottom: 4,
  },
  currentTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  subGreeting: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
    fontWeight: '500',
  },
  currentDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  profileIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 25,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 15,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 15,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#1e293b', // Darker color for better visibility
    marginTop: 4,
    fontWeight: '500', // Added font weight for better readability
  },
  
  // Users Screen Styles
  screenHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    marginLeft: 8,
    padding: 0,
  },
  sectionListContent: {
    padding: 15,
    paddingBottom: 30,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
  },
  sectionHeaderCount: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sectionHeaderCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 4,
    fontWeight: '500', // Added font weight for better readability
  },
  userBranch: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  userStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pendingBadge: {
    backgroundColor: '#fef9c3',
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
  },
  userStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  
  // Enhanced Users Screen Styles
  enhancedScreenHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  enhancedHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedScreenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  enhancedHeaderStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedStatBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  enhancedStatBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  enhancedSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  enhancedSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    marginLeft: 8,
    paddingVertical: 0,
  },
  enhancedSearchClear: {
    padding: 4,
  },
  enhancedFilterTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  enhancedFilterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  enhancedFilterTabActive: {
    backgroundColor: '#eff6ff',
  },
  enhancedFilterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 4,
  },
  enhancedFilterTabTextActive: {
    color: '#3b82f6',
  },
  enhancedSortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  enhancedSortLabel: {
    fontSize: 13,
    color: '#64748b',
    marginRight: 4,
  },
  enhancedSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enhancedSortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
    marginRight: 4,
  },
  enhancedResultsCount: {
    marginBottom: 8,
  },
  enhancedResultsCountText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  enhancedLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  enhancedLoaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  enhancedSectionListContent: {
    padding: 16,
    paddingBottom: 30,
  },
  enhancedSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  enhancedSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 6,
  },
  enhancedSectionCount: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  enhancedSectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  enhancedUserCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  enhancedUserCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  enhancedUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  enhancedUserAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  enhancedUserInfo: {
    flex: 1,
  },
  enhancedUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  enhancedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  enhancedUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  enhancedUserBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  enhancedUserEmail: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
  },
  enhancedUserMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedUserMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  enhancedUserMetaText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  enhancedUserAction: {
    marginLeft: 8,
  },
  enhancedEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  enhancedEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  enhancedEmptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  enhancedEmptyButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enhancedEmptyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  enhancedModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  enhancedModalView: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  enhancedModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  enhancedModalClose: {
    padding: 4,
  },
  enhancedModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  enhancedUserProfileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f8fafc',
  },
  enhancedUserProfileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedUserProfileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  enhancedUserProfileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  enhancedUserProfileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enhancedUserProfileBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  enhancedUserProfileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  enhancedUserProfileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  enhancedUserProfileCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  enhancedUserProfileCardContent: {
    padding: 16,
  },
  enhancedUserProfileItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  enhancedUserProfileItemIcon: {
    width: 36,
    alignItems: 'center',
    marginRight: 8,
  },
  enhancedUserProfileItemContent: {
    flex: 1,
  },
  enhancedUserProfileItemLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  enhancedUserProfileItemValue: {
    fontSize: 15,
    color: '#0f172a',
  },
  enhancedUserProfileDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
    marginLeft: 36,
  },
  enhancedUserProfileStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  enhancedUserProfileStatusPending: {
    backgroundColor: '#fff7ed',
  },
  enhancedUserProfileStatusComplete: {
    backgroundColor: '#f0fdf4',
  },
  enhancedUserProfileStatusContent: {
    flex: 1,
    marginLeft: 12,
  },
  enhancedUserProfileStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  enhancedUserProfileStatusDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  enhancedUserProfileActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 24,
  },
  enhancedUserProfileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enhancedUserProfileActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  
  // Tasks Screen Styles
  filterContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f1f5f9',
  },
  filterButtonActive: {
    backgroundColor: '#dbeafe',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b', // Darker color for better visibility
  },
  filterButtonTextActive: {
    color: '#3b82f6',
  },
  taskTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  taskTypeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  tasksList: {
    padding: 15,
    paddingBottom: 30,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 4,
  },
  taskCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  taskCardDescription: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 12,
    fontWeight: '400', // Added font weight for better readability
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCardInfoText: {
    fontSize: 12,
    color: '#1e293b', // Darker color for better visibility
    marginLeft: 4,
    fontWeight: '500', // Added font weight for better readability
  },
  
  // Tickets Screen Styles
  ticketsList: {
    padding: 15,
    paddingBottom: 30,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  ticketDate: {
    fontSize: 12,
    color: '#1e293b', // Darker color for better visibility
    fontWeight: '500', // Added font weight for better readability
  },
  ticketCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  ticketCardDescription: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 12,
    fontWeight: '400', // Added font weight for better readability
  },
  ticketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketCardInfoText: {
    fontSize: 12,
    color: '#1e293b', // Darker color for better visibility
    marginLeft: 4,
    fontWeight: '500', // Added font weight for better readability
  },
  approvalInfoContainer: {
    marginTop: 4,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  approvalInfoText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  completedInfoText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
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
    borderBottomColor: '#f1f5f9',
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
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
    color: '#1e293b', // Darker color for better visibility
    marginLeft: 8,
    fontWeight: '500', // Added font weight for better readability
  },
  descriptionContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    lineHeight: 20,
    fontWeight: '400', // Added font weight for better readability
  },
  updatesContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  updatesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  updatesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  updateRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  updateKey: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
    marginRight: 8,
  },
  updateValue: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    flex: 1,
    fontWeight: '400', // Added font weight for better readability
  },
  updateError: {
    fontSize: 14,
    color: '#ef4444',
  },
  updateErrorDetails: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
    fontStyle: 'italic',
  },
  updateInfo: {
    fontSize: 14,
    color: '#3b82f6',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  responseContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  responseBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  responseText: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    lineHeight: 20,
    fontWeight: '400', // Added font weight for better readability
    marginBottom: 10,
  },
  approvedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginTop: 8,
    marginBottom: 8,
  },
  approvedByText: {
    color: '#059669',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  completedText: {
    color: '#16a34a',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 0,
  },
  approveButton: {
    flexDirection: 'row',
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  rejectButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 15,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // User Detail Modal Styles
  userDetailHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userDetailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userDetailAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  userDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 5,
  },
  userDetailRole: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    fontWeight: '500', // Added font weight for better readability
  },
  userDetailSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 15,
  },
  userDetailRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  userDetailInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userDetailLabel: {
    fontSize: 12,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 4,
    fontWeight: '500', // Added font weight for better readability
  },
  userDetailValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  userDetailStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  pendingStatusCard: {
    backgroundColor: '#fef9c3',
  },
  completedStatusCard: {
    backgroundColor: '#dcfce7',
  },
  userDetailStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },
  
  // Empty List Styles
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Profile Screen Styles
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
  profileInfoDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 15,
  },
  logoutButtonProfile: {
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    shadowColor: '#c53030',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  logoutButtonProfileInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  logoutButtonProfileText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.3,
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
  
  // ========== MODERN UI STYLES ==========
  
  // Modern Screen Container
  modernScreenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Modern Loader
  modernLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modernLoaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  
  // Modern Dashboard Header
  modernDashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modernGreetingSection: {
    flex: 1,
  },
  modernGreeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  modernSubGreeting: {
    fontSize: 14,
    color: '#64748b',
  },
  modernTimeDisplay: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modernTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Modern Stats Grid
  modernStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  modernStatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '48%',
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modernStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernStatInfo: {
    flex: 1,
  },
  modernStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  modernStatLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  modernStatFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  modernStatTrend: {
    fontSize: 12,
    color: '#64748b',
  },
  
  // Modern Section Containers
  modernSectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  modernViewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  modernViewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  
  // Modern Action Grid
  modernActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modernActionCard: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  modernActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    textAlign: 'center',
  },
  
  // Modern Activity List
  modernActivityList: {
    marginTop: 8,
  },
  modernActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modernActivityIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernActivityContent: {
    flex: 1,
  },
  modernActivityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  modernActivityDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  modernActivityTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  
  // Modern Users Screen Styles
  modernScreenHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modernHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernScreenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  modernHeaderStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  modernStatBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 4,
  },
  modernSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    marginLeft: 8,
    paddingVertical: 0,
  },
  modernSearchClear: {
    padding: 4,
  },
  modernFilterTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernFilterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  modernFilterTabActive: {
    backgroundColor: '#eff6ff',
  },
  modernFilterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 4,
  },
  modernFilterTabTextActive: {
    color: '#3b82f6',
  },
  modernSortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  modernSortLabel: {
    fontSize: 13,
    color: '#64748b',
    marginRight: 4,
  },
  modernSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernSortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
    marginRight: 4,
  },
  modernResultsCount: {
    marginBottom: 8,
  },
  modernResultsCountText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  modernSectionListContent: {
    padding: 16,
    paddingBottom: 30,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  modernSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 6,
  },
  modernSectionCount: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  modernSectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  modernUserCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  modernUserCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  modernUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modernUserAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modernUserInfo: {
    flex: 1,
  },
  modernUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modernUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  modernUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  modernUserBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  modernUserEmail: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
  },
  modernUserMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernUserMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  modernUserMetaText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  modernUserAction: {
    marginLeft: 8,
  },
  modernEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  modernEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  modernEmptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  modernEmptyButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modernEmptyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  
  // Modern Modal Styles
  modernModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modernModalView: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modernModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modernModalClose: {
    padding: 4,
  },
  modernModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modernUserProfileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f8fafc',
  },
  modernUserProfileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernUserProfileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modernUserProfileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  modernUserProfileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernUserProfileBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  modernUserProfileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  modernUserProfileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modernUserProfileCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  modernUserProfileCardContent: {
    padding: 16,
  },
  modernUserProfileItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modernUserProfileItemIcon: {
    width: 36,
    alignItems: 'center',
    marginRight: 8,
  },
  modernUserProfileItemContent: {
    flex: 1,
  },
  modernUserProfileItemLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  modernUserProfileItemValue: {
    fontSize: 15,
    color: '#0f172a',
  },
  modernUserProfileDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
    marginLeft: 36,
  },
  modernUserProfileStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  modernUserProfileStatusPending: {
    backgroundColor: '#fff7ed',
  },
  modernUserProfileStatusComplete: {
    backgroundColor: '#f0fdf4',
  },
  modernUserProfileStatusContent: {
    flex: 1,
    marginLeft: 12,
  },
  modernUserProfileStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modernUserProfileStatusDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  modernUserProfileActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 24,
  },
  modernUserProfileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modernUserProfileActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  
  // Modern Tasks Screen Styles
  modernTasksHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modernTasksTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  modernTasksFilterContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  modernTasksFilterScroll: {
    paddingBottom: 8,
  },
  modernTasksFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernTasksFilterButtonActive: {
    backgroundColor: '#eff6ff',
  },
  modernTasksFilterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 4,
  },
  modernTasksFilterButtonTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  modernTasksList: {
    padding: 16,
    paddingBottom: 30,
  },
  modernTaskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  modernTaskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernTaskStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernTaskStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  modernTaskOverdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernTaskOverdueText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 4,
  },
  modernTaskCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  modernTaskCardDescription: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 12,
  },
  modernTaskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  modernTaskCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernTaskCardInfoText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  
  // Modern Tickets Screen Styles
  modernTicketsHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modernTicketsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  modernTicketsFilterContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  modernTicketsFilterScroll: {
    paddingBottom: 8,
  },
  modernTicketsFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernTicketsFilterButtonActive: {
    backgroundColor: '#eff6ff',
  },
  modernTicketsFilterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 4,
  },
  modernTicketsFilterButtonTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  modernTicketsList: {
    padding: 16,
    paddingBottom: 30,
  },
  modernTicketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  modernTicketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernTicketStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernTicketStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  modernTicketDate: {
    fontSize: 12,
    color: '#64748b',
  },
  modernTicketCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  modernTicketCardDescription: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 12,
  },
  modernTicketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  modernTicketCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernTicketCardInfoText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  
  // Modern Profile Screen Styles
  modernProfileContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modernProfileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modernProfileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modernProfileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  modernProfileEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  modernProfileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modernProfileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modernProfileCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  modernProfileCardContent: {
    padding: 16,
  },
  modernProfileInfoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modernProfileInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernProfileInfoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  modernProfileInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  modernProfileInfoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  modernProfileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modernProfileActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernProfileActionText: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  modernLogoutAction: {
    borderBottomWidth: 0,
  },
  modernLogoutIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  modernLogoutActionText: {
    color: '#ef4444',
  },
});

// New AdminDashboard Component with Hideable Sidebar Navigation
const AdminDashboardWithSidebar = () => {
  // State for sidebar and content
  const [activeScreen, setActiveScreen] = useState('Home');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
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
      console.log('Uploading photo to:', `http://${IP}:3000/api/admin/upload-photo`);
      console.log('Token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.post(
        `http://${IP}:3000/api/admin/upload-photo`,
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
        setAdminProfile(prev => ({
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
        `http://${IP}:3000/api/admin/remove-photo`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        setAdminProfile(prev => ({
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
        
        // Fetch admin profile
        const profileResponse = await axios.get(`http://${IP}:3000/api/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setAdminProfile(profileResponse.data);
        
        // Fetch user count
        const usersResponse = await axios.get(`http://${IP}:3000/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Handle different data structures
        if (usersResponse.data) {
          if (usersResponse.data.students && usersResponse.data.faculty) {
            // If data has students and faculty properties
            setUserCount(usersResponse.data.students.length + usersResponse.data.faculty.length);
          } else if (Array.isArray(usersResponse.data)) {
            // If data is an array
            setUserCount(usersResponse.data.length);
          } else {
            // Default to 0 if structure is unknown
            setUserCount(0);
          }
        }
        
        // Fetch pending tickets count for notifications
        try {
          const ticketsResponse = await axios.get(`http://${IP}:3000/api/admin/tickets`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (Array.isArray(ticketsResponse.data)) {
            // Count pending tickets
            const pendingTickets = ticketsResponse.data.filter(ticket => 
              ticket.status === 'pending'
            ).length;
            setUnreadNotifications(pendingTickets);
          } else {
            // Default to 0 if no tickets or unknown structure
            setUnreadNotifications(0);
          }
        } catch (error) {
          console.error('Error fetching tickets count:', error);
          // Set a default value for demo purposes
          setUnreadNotifications(3);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
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
  
  // Render the active screen content
  const renderScreen = () => {
    switch (activeScreen) {
      case 'Home':
        return <HomeScreen />;
      case 'Users':
        return <UsersScreen />;
      case 'Tasks':
        return <TasksScreen />;
      case 'Tickets':
        return <TicketsScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };
  
  // Show loading indicator while data is being fetched
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
              onPress={toggleSidebar}
            />
          </Animated.View>
        )}
        
        {/* Sidebar - now slides in from left and is scrollable */}
        {sidebarVisible && (
          <Animated.View 
            style={[
              styles.sidebar,
              {
                transform: [{ translateX: sidebarTranslateX }],
                backgroundColor: '#1e293b',
                flex: 1,
                height: '100%',
                minHeight: screenHeight,
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 290,
                zIndex: 100,
              }
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
            {/* User Profile - Faculty Sidebar Style (solid color, centered) */}
            <View style={{
              backgroundColor: '#2563eb',
              alignItems: 'center',
              paddingVertical: 32,
              marginBottom: 0,
              width: '100%',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}>
              <TouchableOpacity
                style={{ alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setPhotoModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={{ position: 'relative', width: 72, height: 72, marginBottom: 10, alignItems: 'center', justifyContent: 'center' }}>
                  {/* Online/active status indicator as green border around avatar */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      borderWidth: 4,
                      borderColor: '#22c55e', // green border
                      zIndex: 2,
                    }}
                  />
                  {adminProfile?.photo ? (
                    <Image
                      source={{ uri: adminProfile.photo + '?t=' + Date.now() }}
                      style={{ width: 72, height: 72, borderRadius: 36, resizeMode: 'cover' }}
                    />
                  ) : (
                    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 36, color: '#2563eb', fontWeight: 'bold' }}>
                        {adminProfile?.name ? adminProfile.name[0].toUpperCase() : 'A'}
                      </Text>
                    </View>
                  )}
                  <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: '#2563eb', borderRadius: 10, padding: 2, zIndex: 3 }}>
                    <MaterialIcons name="photo-camera" size={14} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }} numberOfLines={2} ellipsizeMode="tail">
                {adminProfile?.name || 'Admin'}
              </Text>
              <Text style={{ color: '#e0e7ef', fontSize: 15, marginBottom: 2, fontWeight: '600', textAlign: 'center' }}>
                Administrator
              </Text>
            </View>
            
            {/* Navigation Menu - Faculty Sidebar Style (dark background) */}
            <View style={{
              backgroundColor: '#1e293b',
              paddingTop: 0,
              paddingBottom: 24,
              minHeight: 320,
              width: '100%',
            }}>
              <SidebarItem
                icon={<MaterialIcons name="dashboard" size={24} color={activeScreen === 'Home' ? '#fff' : '#fff'} />}
                label="Dashboard"
                isActive={activeScreen === 'Home'}
                onPress={() => {
                  setActiveScreen('Home');
                  toggleSidebar();
                }}
                style={activeScreen === 'Home' ? { backgroundColor: '#2563eb', borderRadius: 12, marginHorizontal: 16, marginVertical: 6, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' } : { marginHorizontal: 16, marginVertical: 6, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}
                labelStyle={{ fontWeight: 'bold', fontSize: 18, color: '#fff', marginLeft: 12 }}
              />

              <SidebarItem
                icon={<MaterialIcons name="people" size={24} color={activeScreen === 'Users' ? '#fff' : '#fff'} />}
                label="User Management"
                isActive={activeScreen === 'Users'}
                onPress={() => {
                  setActiveScreen('Users');
                  toggleSidebar();
                }}
                badgeCount={userCount > 0 ? userCount : 0}
                badgeStyle={{ backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', fontSize: 13, minWidth: 24, height: 24, borderRadius: 12, textAlign: 'center', textAlignVertical: 'center', position: 'absolute', right: 18, top: 12, paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }}
                style={activeScreen === 'Users' ? { backgroundColor: '#2563eb', borderRadius: 12, marginHorizontal: 16, marginVertical: 6, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' } : { marginHorizontal: 16, marginVertical: 6, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}
                labelStyle={{ fontWeight: 'bold', fontSize: 18, color: '#fff', marginLeft: 12 }}
              />

              <SidebarItem
                icon={<MaterialIcons name="assignment" size={24} color={activeScreen === 'Tasks' ? '#fff' : '#fff'} />}
                label="Tasks"
                isActive={activeScreen === 'Tasks'}
                onPress={() => {
                  setActiveScreen('Tasks');
                  toggleSidebar();
                }}
                style={activeScreen === 'Tasks' ? { backgroundColor: '#2563eb', borderRadius: 12, marginHorizontal: 16, marginVertical: 6, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' } : { marginHorizontal: 16, marginVertical: 6, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}
                labelStyle={{ fontWeight: 'bold', fontSize: 18, color: '#fff', marginLeft: 12 }}
              />

              <SidebarItem
                icon={<MaterialIcons name="confirmation-number" size={24} color={activeScreen === 'Tickets' ? '#fff' : '#fff'} />}
                label="Tickets"
                isActive={activeScreen === 'Tickets'}
                onPress={() => {
                  setActiveScreen('Tickets');
                  toggleSidebar();
                }}
                badgeCount={unreadNotifications}
                badgeStyle={{ backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', fontSize: 13, minWidth: 24, height: 24, borderRadius: 12, textAlign: 'center', textAlignVertical: 'center', position: 'absolute', right: 18, top: 12, paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }}
                style={activeScreen === 'Tickets' ? { backgroundColor: '#2563eb', borderRadius: 12, marginHorizontal: 16, marginVertical: 6, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' } : { marginHorizontal: 16, marginVertical: 6, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}
                labelStyle={{ fontWeight: 'bold', fontSize: 18, color: '#fff', marginLeft: 12 }}
              />

              <SidebarItem
                icon={<MaterialIcons name="person" size={24} color={activeScreen === 'Profile' ? '#fff' : '#fff'} />}
                label="Profile"
                isActive={activeScreen === 'Profile'}
                onPress={() => {
                  setActiveScreen('Profile');
                  toggleSidebar();
                }}
                style={activeScreen === 'Profile' ? { backgroundColor: '#2563eb', borderRadius: 12, marginHorizontal: 16, marginVertical: 6, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' } : { marginHorizontal: 16, marginVertical: 6, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}
                labelStyle={{ fontWeight: 'bold', fontSize: 18, color: '#fff', marginLeft: 12 }}
              />

              <SidebarItem
                icon={<MaterialIcons name="exit-to-app" size={22} color="#fff" />}
                label="Logout"
                isActive={false}
                onPress={() => {
                  Alert.alert(
                    'Confirm Logout',
                    'Are you sure you want to logout?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await AsyncStorage.removeItem('token');
                            navigation.reset({
                              index: 0,
                              routes: [{ name: 'Login' }],
                            });
                          } catch (error) {
                            console.error('Error logging out:', error);
                          }
                        }
                      }
                    ]
                  );
                }}
                style={{ marginHorizontal: 16, marginVertical: 6, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}
                labelStyle={{ fontWeight: 'bold', fontSize: 18, color: '#fff', marginLeft: 12 }}
              />

              {/* Extra padding at bottom for better scrolling */}
              <View style={{ height: 40 }} />
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
              
              {/* Dynamic Header Content Based on Active Screen */}
              {activeScreen === 'Home' && (
                <View style={styles.headerContent}>
                  <Text style={styles.screenTitle}>Admin Dashboard</Text>
                  <Text style={styles.screenSubtitle}>Academic Management & Student Services</Text>
                </View>
              )}
              
              {activeScreen === 'Users' && (
                <View style={styles.headerContent}>
                  <Text style={styles.screenTitle}>User Management</Text>
                  <Text style={styles.screenSubtitle}>
                    {userCount > 0 ? `${userCount} Active Users` : 'Manage Faculty & Students'}
                  </Text>
                </View>
              )}
              
              {activeScreen === 'Tasks' && (
                <View style={styles.headerContent}>
                  <Text style={styles.screenTitle}>Academic Assignments</Text>
                  <Text style={styles.screenSubtitle}>Faculty-assigned Tasks to Students</Text>
                </View>
              )}
              
              {activeScreen === 'Tickets' && (
                <View style={styles.headerContent}>
                  <Text style={styles.screenTitle}>Student Request Center</Text>
                  <Text style={styles.screenSubtitle}>
                    {unreadNotifications > 0 ? `${unreadNotifications} Pending Requests` : 'Profile Update Requests'}
                  </Text>
                </View>
              )}
              
              {activeScreen === 'Profile' && (
                <View style={styles.headerContent}>
                  <Text style={styles.screenTitle}>Admin Profile</Text>
                  <Text style={styles.screenSubtitle}>
                    {adminProfile?.name || 'Administrator Account'}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Empty right side - icons removed */}
            <View style={styles.topNavRight}></View>
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
              {adminProfile?.photo ? (
                <TouchableOpacity
                  onPress={() => setFullPhotoVisible(true)}
                >
                  <Image 
                    source={{ uri: adminProfile.photo }} 
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
              
              {adminProfile?.photo && (
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
            source={{ uri: adminProfile?.photo }}
            style={styles.fullPhoto}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

// Export the AdminDashboardWithSidebar component
export default AdminDashboardWithSidebar;