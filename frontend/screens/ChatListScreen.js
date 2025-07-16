import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IP } from '../ip';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#7c3aed', // Vivid purple
  secondary: '#f3e8ff', // Light purple
  background: '#f8fafc',
  card: '#fff',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  success: '#22c55e',
  online: '#22c55e',
  offline: '#94a3b8',
  inputBar: '#fff',
  inputShadow: '#a78bfa',
};

const ChatListScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeScreen();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const initializeScreen = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('userRole');
      
      console.log('ChatListScreen - Auth data:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        role: role
      });
      
      if (!token || !role) {
        console.log('Missing auth data:', { token: !!token, role: !!role });
        Alert.alert('Error', 'Authentication required');
        navigation.goBack();
        return;
      }

      setUserRole(role);
      await fetchUsers(token, role);
    } catch (error) {
      console.error('Error initializing chat list:', error);
      Alert.alert('Error', 'Failed to load chat list');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (token, role) => {
    try {
      let endpoint = '';
      
      // Students see faculty, faculty see students
      if (role === 'student') {
        endpoint = '/api/chat/faculty';
      } else if (role === 'faculty') {
        endpoint = '/api/chat/students';
      }

      console.log('Fetching users:', {
        role,
        endpoint,
        url: `http://${IP}:3000${endpoint}`,
        hasToken: !!token
      });

      // Test if the chat route is accessible
      try {
        const testResponse = await fetch(`http://${IP}:3000/api/chat/test`);
        const testData = await testResponse.json();
        console.log('Test route response:', testData);
      } catch (testError) {
        console.error('Test route error:', testError);
      }

      const response = await fetch(`http://${IP}:3000${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
      }

      const fetchedUsers = await response.json();
      console.log('Fetched users:', fetchedUsers);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', `Failed to load users: ${error.message}`);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.course && user.course.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredUsers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await fetchUsers(token, userRole);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUserPress = (user) => {
    const recipientRole = userRole === 'student' ? 'faculty' : 'student';
    navigation.navigate('ChatScreen', {
      recipientId: user.id,
      recipientRole: recipientRole,
      recipientName: user.name,
    });
  };

  const renderUserItem = ({ item, index }) => {
    const isOnline = Math.random() > 0.5; // Mock online status
    
    return (
      <Animated.View
        style={[
          styles.userItem,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleUserPress(item)}
          style={styles.userTouchable}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {item.photo ? (
                <Image
                  source={{ uri: item.photo }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}> 
                  <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.online : COLORS.offline }]} />
            </View>
            
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userMeta}>
                {userRole === 'student' 
                  ? `${item.department || 'Department'} • Faculty`
                  : `${item.course || 'Course'} • Year ${item.year || 'N/A'}`
                }
              </Text>
            </View>
          </View>
          
          <View style={styles.userActions}>
            <MaterialIcons name="chat" size={24} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        Chat with {userRole === 'student' ? 'Faculty' : 'Students'}
      </Text>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={COLORS.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={COLORS.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="chat" size={64} color={COLORS.muted} />
      <Text style={styles.emptyTitle}>No users found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : `No ${userRole === 'student' ? 'faculty' : 'students'} available for chat`
        }
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient
        colors={[COLORS.secondary, COLORS.background]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.secondary, COLORS.background]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        {renderHeader()}
        {renderSearchBar()}
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.userList}
          contentContainerStyle={styles.userListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.muted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderBottomWidth: 0,
    elevation: 4,
    shadowColor: COLORS.inputShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderBottomWidth: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 2,
    elevation: 2,
    shadowColor: COLORS.inputShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: COLORS.inputShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 8,
  },
  userList: {
    flex: 1,
  },
  userListContent: {
    padding: 16,
  },
  userItem: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: COLORS.inputShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
  },
  userTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.inputShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: COLORS.inputShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 2,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 12,
    color: COLORS.muted,
  },
  userActions: {
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});

export default ChatListScreen;