import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView
} from 'react-native';
import axios from 'axios';
import { IP } from '../../ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { ticketId, updates } = route.params; // ticketId and updates (empty object)
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    branch: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current profile to initialize fields
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await axios.get(`http://${IP}:3000/api/student/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          setProfile({
            name: response.data.name || '',
            email: response.data.email || '',
            branch: response.data.branch || ''
          });
        } else {
          throw new Error('Invalid profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async () => {
    try {
      // Validate inputs
      if (!profile.name.trim() || !profile.email.trim() || !profile.branch.trim()) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }

      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(
        `http://${IP}:3000/api/student/profile`,
        {
          ticket_id: ticketId,
          updates: {
            name: profile.name.trim(),
            email: profile.email.trim(),
            branch: profile.branch.trim()
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Profile updated successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('StudentDashboard') // changed from 'Profile'
            }
          ]
        );
      } else {
        throw new Error('Profile update failed');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        `Failed to update profile: ${error.response?.data?.error || error.message || 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.navigate('StudentDashboard'); // changed from 'Profile'
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.container}>
        <View style={styles.enhancedProfileCard}>
          <View style={styles.enhancedCardHeader}>
            <MaterialIcons name="person" size={28} color="#6366f1" />
            <Text style={styles.enhancedCardTitle}>Update Your Profile</Text>
          </View>
          
          <Text style={styles.enhancedCardSubtitle}>
            Your request has been approved. You can now update your information.
          </Text>
          
          <View style={styles.enhancedFormContainer}>
            <View style={styles.enhancedInputGroup}>
              <Text style={styles.enhancedInputLabel}>
                <MaterialIcons name="person" size={18} color="#6366f1" style={styles.enhancedInputIcon} />
                Full Name
              </Text>
              <TextInput
                style={styles.enhancedInput}
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
              />
            </View>
            
            <View style={styles.enhancedInputGroup}>
              <Text style={styles.enhancedInputLabel}>
                <MaterialIcons name="email" size={18} color="#6366f1" style={styles.enhancedInputIcon} />
                Email Address
              </Text>
              <TextInput
                style={styles.enhancedInput}
                value={profile.email}
                onChangeText={(text) => setProfile({ ...profile, email: text })}
                placeholder="Enter your email address"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.enhancedInputGroup}>
              <Text style={styles.enhancedInputLabel}>
                <MaterialIcons name="school" size={18} color="#6366f1" style={styles.enhancedInputIcon} />
                Branch / Department
              </Text>
              <TextInput
                style={styles.enhancedInput}
                value={profile.branch}
                onChangeText={(text) => setProfile({ ...profile, branch: text })}
                placeholder="Enter your branch or department"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
          
          <View style={styles.enhancedButtonContainer}>
            <TouchableOpacity
              style={styles.enhancedCancelButton}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <MaterialIcons name="close" size={20} color="#64748b" />
              <Text style={styles.enhancedCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.enhancedSubmitButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color="#ffffff" />
                  <Text style={styles.enhancedSubmitButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerRight: {
    width: 40, // Same width as back button for balance
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  // Old styles kept for backward compatibility
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#1f2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Enhanced Profile Form Styles
  enhancedProfileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  enhancedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  enhancedCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 12,
  },
  enhancedCardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 20,
  },
  enhancedFormContainer: {
    marginBottom: 24,
  },
  enhancedInputGroup: {
    marginBottom: 20,
  },
  enhancedInputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedInputIcon: {
    marginRight: 6,
  },
  enhancedInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  enhancedButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  enhancedCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flex: 1,
    marginRight: 10,
  },
  enhancedCancelButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  enhancedSubmitButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  enhancedSubmitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EditProfileScreen;