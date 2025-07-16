import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Now receives facultyProfile, setFacultyProfile, fetchProfile, loading, handleProfilePhotoUpload, uploading as props
const FacultyProfileScreen = ({
  navigation,
  facultyProfile,
  setFacultyProfile,
  fetchProfile,
  loading,
  handleProfilePhotoUpload,
  uploading,
}) => {
  const [error, setError] = useState(null);

  // Refresh profile when screen comes into focus
  useEffect(() => {
    if (navigation && navigation.addListener && fetchProfile) {
      const unsubscribe = navigation.addListener('focus', fetchProfile);
      return unsubscribe;
    }
  }, [navigation, fetchProfile]);

  // Use the unified upload handler from dashboard
  const pickImage = () => handleProfilePhotoUpload(false);


  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#8e44ad" /></View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}><Text>{error}</Text></View>
    );
  }
  if (!facultyProfile) return null;
  return (
    <ScrollView style={{ backgroundColor: '#f8fafc' }}>
      <View style={styles.profileHeaderSection}>
        <View style={styles.profileAvatarWrapper}>
          <View style={styles.profileAvatarBorder} />
          {facultyProfile.photo ? (
            <Image
              source={{ uri: facultyProfile.photo + '?t=' + Date.now() }}
              style={styles.profileAvatar}
            />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <Text style={styles.profileAvatarText}>{facultyProfile.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.profileEditPhotoButton} onPress={pickImage}>
            {uploading ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <MaterialIcons name="photo-camera" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.profileName}>{facultyProfile.name}</Text>
        <Text style={styles.profileEmail}>{facultyProfile.email}</Text>
        <View style={styles.profileBadge}>
          <MaterialIcons name="person-pin" size={14} color="#0ea5e9" />
          <Text style={styles.profileBadgeText}>Faculty</Text>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="contact-mail" size={20} color="#3b82f6" />
          <Text style={styles.cardTitle}>Contact Information</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.item}>
            <View style={styles.itemIcon}>
              <MaterialIcons name="email" size={20} color="#64748b" />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Email Address</Text>
              <Text style={styles.itemValue}>{facultyProfile.email}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.item}>
            <View style={styles.itemIcon}>
              <MaterialIcons name="business" size={20} color="#64748b" />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Department/Branch</Text>
              <Text style={styles.itemValue}>{facultyProfile.branch || 'Not specified'}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="event" size={20} color="#3b82f6" />
          <Text style={styles.cardTitle}>Account Details</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.item}>
            <View style={styles.itemIcon}>
              <MaterialIcons name="fingerprint" size={20} color="#64748b" />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Faculty ID</Text>
              <Text style={styles.itemValue}>{facultyProfile.id}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.item}>
            <View style={styles.itemIcon}>
              <MaterialIcons name="calendar-today" size={20} color="#64748b" />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Created At</Text>
              <Text style={styles.itemValue}>{facultyProfile.created_at ? new Date(facultyProfile.created_at).toLocaleString() : '-'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.item}>
            <View style={styles.itemIcon}>
              <MaterialIcons name="update" size={20} color="#64748b" />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Updated At</Text>
              <Text style={styles.itemValue}>{facultyProfile.updated_at ? new Date(facultyProfile.updated_at).toLocaleString() : '-'}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  profileHeaderSection: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 8,
  },
  profileAvatarWrapper: {
    width: 90,
    height: 90,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileAvatarBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#22c55e', // green border
    zIndex: 1,
  },
  profileAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#fff',
    zIndex: 2,
  },
  profileAvatarPlaceholder: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  profileEditPhotoButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 5,
    zIndex: 3,
    elevation: 2,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
    marginTop: 2,
  },
  profileEmail: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 6,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    marginBottom: 2,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#0ea5e9',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  cardContent: { padding: 16 },
  item: { flexDirection: 'row', alignItems: 'flex-start' },
  itemIcon: { width: 36, alignItems: 'center', marginRight: 8 },
  itemContent: { flex: 1 },
  itemLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  itemValue: { fontSize: 15, color: '#0f172a' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12, marginLeft: 36 },
});

export default FacultyProfileScreen;
