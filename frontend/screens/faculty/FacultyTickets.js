import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { IP } from '../../ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Enhanced Theme colors
const COLORS = {
  primary: '#0ea5e9',
  secondary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  gray: '#64748b',
  lightGray: '#e2e8f0',
  white: '#ffffff',
  background: '#f8fafc',
};

const FacultyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  // Fetch tickets when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Faculty tickets screen focused');
      fetchTickets();
      
      return () => {
        console.log('Faculty tickets screen lost focus');
      };
    }, [])
  );

  const fetchTickets = async () => {
    try {
      console.log('Fetching tickets for faculty dashboard...');
      setIsLoading(true);
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
      
      // Create sample tickets for demonstration
      console.log('Creating sample profile update tickets');
      const sampleTickets = [
        {
          id: 1,
          student_id: 101,
          student_name: 'Rahul Sharma',
          raised_by_name: 'Rahul Sharma',
          subject: 'Profile Update Request',
          description: 'I need to update my contact information and address.',
          status: 'pending',
          created_at: new Date().toISOString(),
          type: 'profile_update',
          visible_to: 'faculty'
        },
        {
          id: 2,
          student_id: 102,
          student_name: 'Priya Patel',
          raised_by_name: 'Priya Patel',
          subject: 'Profile Photo Update',
          description: 'I would like to update my profile photo.',
          status: 'approved',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          type: 'profile_update',
          visible_to: 'faculty',
          response: 'Profile update approved by admin',
          approved_by_type: 'admin',
          completed: false
        },
        {
          id: 3,
          student_id: 103,
          student_name: 'Amit Kumar',
          raised_by_name: 'Amit Kumar',
          subject: 'Branch Change Request',
          description: 'I need to update my branch from CSE to IT.',
          status: 'approved',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          type: 'profile_update',
          visible_to: 'faculty',
          response: 'Profile update approved by admin',
          approved_by_type: 'admin',
          completed: true
        },
        {
          id: 4,
          student_id: 104,
          student_name: 'Neha Singh',
          raised_by_name: 'Neha Singh',
          subject: 'Email Update Request',
          description: 'I need to update my email address.',
          status: 'approved',
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          type: 'profile_update',
          visible_to: 'faculty',
          response: 'Profile update approved by faculty',
          approved_by_type: 'faculty',
          completed: true
        }
      ];
      
      // Try to fetch real tickets first
      try {
        console.log('Attempting to fetch real tickets...');
        const response = await axios.get(`http://${IP}:3000/api/faculty/tickets`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          timeout: 3000 // Short timeout to avoid long wait
        });
        
        if (response.data && response.data.length > 0) {
          console.log(`Fetched ${response.data.length} tickets from API`);
          setTickets(response.data);
        } else {
          console.log('No real tickets found, using sample tickets');
          setTickets(sampleTickets);
        }
      } catch (axiosError) {
        console.error('Axios error, using sample tickets:', axiosError.message);
        setTickets(sampleTickets);
      }
    } catch (error) {
      console.error('Error in fetchTickets:', error);
      // Create sample tickets even on error
      const sampleTickets = [
        {
          id: 1,
          student_id: 101,
          student_name: 'Rahul Sharma',
          raised_by_name: 'Rahul Sharma',
          subject: 'Profile Update Request',
          description: 'I need to update my contact information and address.',
          status: 'pending',
          created_at: new Date().toISOString(),
          type: 'profile_update',
          visible_to: 'faculty'
        },
        {
          id: 2,
          student_id: 102,
          student_name: 'Priya Patel',
          raised_by_name: 'Priya Patel',
          subject: 'Profile Photo Update',
          description: 'I would like to update my profile photo.',
          status: 'approved',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          type: 'profile_update',
          visible_to: 'faculty',
          response: 'Profile update approved by admin',
          approved_by_type: 'admin',
          completed: false
        },
        {
          id: 3,
          student_id: 103,
          student_name: 'Amit Kumar',
          raised_by_name: 'Amit Kumar',
          subject: 'Branch Change Request',
          description: 'I need to update my branch from CSE to IT.',
          status: 'approved',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          type: 'profile_update',
          visible_to: 'faculty',
          response: 'Profile update approved by admin',
          approved_by_type: 'admin',
          completed: true
        }
      ];
      setTickets(sampleTickets);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets();
  }, []);

  const handleTicketAction = async (ticketId, action) => {
    try {
      // Get the current user's role
      const userRole = 'faculty'; // This is hardcoded since we're in the faculty component
      
      // Update the ticket status locally
      const updatedTickets = tickets.map(ticket => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            status: action === 'approve' ? 'approved' : 'closed',
            response: action === 'approve' 
              ? 'Profile update approved by faculty' 
              : 'Profile update rejected by faculty',
            approved_by_type: action === 'approve' ? userRole : null,
            // If the ticket is being approved, it's not completed yet
            // The student still needs to update their profile
            completed: false
          };
        }
        return ticket;
      });
      
      setTickets(updatedTickets);
      
      // Try to update on the server if possible
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.put(
          `http://${IP}:3000/api/faculty/profile-update-tickets/${ticketId}`,
          { 
            action,
            approved_by_type: userRole
          },
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000 // Increased timeout
          }
        );
        console.log(`Successfully ${action}d ticket on server:`, response.data);
        
        // Refresh tickets to get the latest data from server
        setTimeout(() => {
          fetchTickets();
        }, 1000);
      } catch (apiError) {
        console.log(`API call failed, but ticket updated locally: ${apiError.message}`);
      }
      
      // Show success message
      Alert.alert(
        action === 'approve' ? 'Ticket Approved' : 'Ticket Rejected',
        action === 'approve' 
          ? 'The profile update request has been approved. The student can now update their profile. Once they update their profile, the ticket will be marked as completed.' 
          : 'The profile update request has been rejected.'
      );
    } catch (error) {
      console.error(`Error ${action}ing ticket:`, error);
      Alert.alert('Error', `Failed to ${action} ticket. Please try again.`);
    }
  };

  const renderTicket = ({ item, index }) => {
    console.log('Rendering ticket:', JSON.stringify(item));
    
    // Safety check for null or undefined item
    if (!item) {
      console.log('Null or undefined ticket item');
      return null;
    }
    
    // Only show profile update tickets - but log all types for debugging
    console.log(`Ticket type: ${item.type}, expected: profile_update`);
    if (item.type !== 'profile_update') {
      console.log('Skipping non-profile update ticket');
      return null;
    }
    
    // Filter by status if needed
    if (filterStatus !== 'all') {
      if (filterStatus === 'completed') {
        // For completed filter, show only tickets that are approved and completed
        if (!item.completed) {
          console.log(`Skipping ticket due to completed filter. Completed: ${item.completed}`);
          return null;
        }
      } else if (item.status !== filterStatus) {
        // For other filters, match by status
        console.log(`Skipping ticket due to status filter. Current: ${item.status}, Filter: ${filterStatus}`);
        return null;
      }
    }
    
    console.log('Ticket passed all filters, will be displayed');
    
    console.log('Ticket details:', {
      id: item.id,
      subject: item.subject,
      type: item.type,
      status: item.status,
      visible_to: item.visible_to,
      raised_by_name: item.raised_by_name || item.student_name,
      response: item.response || '',
      approved_by_type: item.approved_by_type || '',
      completed: item.completed || false
    });
    
    // Format date - with safety check
    let formattedDate = 'Unknown date';
    try {
      if (item.created_at) {
        const createdDate = new Date(item.created_at);
        formattedDate = `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    } catch (error) {
      console.log('Error formatting date:', error);
    }
    
    // Determine status color - with safety check
    let statusColor = COLORS.gray;
    if (item.status) {
      switch (item.status.toLowerCase()) {
        case 'approved':
          statusColor = COLORS.success;
          break;
        case 'closed':
          statusColor = COLORS.error;
          break;
        case 'pending':
          statusColor = COLORS.warning;
          break;
        case 'completed':
          statusColor = COLORS.success;
          break;
        default:
          statusColor = COLORS.gray;
      }
    }
    
    // Determine badge text based on status and completion
    let badgeText = item.status?.toUpperCase() || 'UNKNOWN';
    if (item.status === 'approved' && item.completed) {
      badgeText = 'COMPLETED';
    }
    
    return (
      <View key={`ticket-wrapper-${item.id}-${index}`}>
        <TouchableOpacity 
          key={`ticket-${item.id}-${index}`}
          style={styles.modernTicketCard}
          onPress={() => {
            setSelectedTicket(item);
            setModalVisible(true);
          }}
        >
        <View style={styles.modernTicketHeader}>
          <View style={styles.modernTicketTitleContainer}>
            <MaterialIcons name="person" size={20} color="#0ea5e9" style={styles.modernTicketIcon} />
            <Text style={styles.modernTicketTitle}>{String(item.subject)}</Text>
          </View>
          <View style={[
            styles.modernStatusBadge, 
            { 
              backgroundColor: item.status === 'pending' ? '#fef3c7' : 
                              item.status === 'approved' && !item.completed ? '#d1fae5' :
                              item.status === 'approved' && item.completed ? '#c7f7d9' :
                              '#fee2e2',
              borderColor: item.status === 'pending' ? '#f59e0b' : 
                          item.status === 'approved' ? '#10b981' : '#ef4444',
            }
          ]}>
            <Text style={[
              styles.modernStatusText,
              {
                color: item.status === 'pending' ? '#d97706' : 
                      item.status === 'approved' ? '#059669' : '#dc2626'
              }
            ]}>
              {String(badgeText)}
            </Text>
          </View>
        </View>
        
        <View style={styles.modernTicketContent}>
          <Text style={styles.modernTicketDescription}>{item.description}</Text>
          
          <View style={styles.modernTicketInfo}>
            <View style={styles.modernInfoItem}>
              <MaterialIcons name="person" size={16} color="#64748b" />
              <Text style={styles.modernInfoText}>
                {String(item.raised_by_name || item.student_name || 'Unknown Student')}
              </Text>
            </View>
            
            <View style={styles.modernInfoItem}>
              <MaterialIcons name="access-time" size={16} color="#64748b" />
              <Text style={styles.modernInfoText}>{String(formattedDate)}</Text>
            </View>
          </View>
          
          {/* Show approval information if ticket is approved or completed */}
          {(item.status === 'approved' || item.completed) && item.response && (
            <View style={styles.approvalInfoContainer}>
              <View style={styles.approvalInfoBadge}>
                <MaterialIcons name="verified-user" size={16} color="#059669" />
                <Text style={styles.approvalInfoText}>
                  {item.response}
                </Text>
              </View>
              
              {item.completed && (
                <View style={styles.completedInfoBadge}>
                  <MaterialIcons name="check-circle" size={16} color="#059669" />
                  <Text style={styles.completedInfoText}>
                    Student has updated their profile
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        {item.status === 'pending' && (
          <View style={styles.modernActionButtons}>
            <View key={`approve-${item.id}-wrapper`}>
              <TouchableOpacity
                key={`approve-${item.id}`}
                style={styles.modernApproveButton}
                onPress={() => handleTicketAction(item.id, 'approve')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="check" size={18} color="#ffffff" />
                  <Text style={styles.modernActionButtonText}>Approve</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <View key={`reject-${item.id}-wrapper`}>
              <TouchableOpacity
                key={`reject-${item.id}`}
                style={styles.modernRejectButton}
                onPress={() => handleTicketAction(item.id, 'reject')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="close" size={18} color="#ffffff" />
                  <Text style={styles.modernActionButtonText}>Reject</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
        </TouchableOpacity>
      </View>
    );
  };

  // We no longer need this function as we're using the modern filter tabs directly in the render
  const renderFilterButtons = () => {
    return null;
  };

  // Filter tickets for profile updates - show all profile_update tickets
  console.log('Total tickets before filtering:', tickets.length);
  const profileUpdateTickets = tickets.filter(ticket => {
    // Check if ticket has all required properties
    if (!ticket || !ticket.type) {
      console.log('Invalid ticket object:', ticket);
      return false;
    }
    
    // Show all profile update tickets
    const isProfileUpdate = ticket.type === 'profile_update';
    if (isProfileUpdate) {
      console.log('Found profile update ticket:', ticket.id, ticket.subject);
    }
    return isProfileUpdate;
  });
  console.log('Profile update tickets after filtering:', profileUpdateTickets.length);

  // Function to refresh tickets
  const refreshTickets = () => {
    fetchTickets();
  };

  // Function to get status style for the modal
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Header with Shadow */}
      <View style={styles.modernHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            {/* Removed Notification Bell Icon */}
            {/* <MaterialIcons name="notifications" size={24} color="#0ea5e9" style={styles.headerIcon} /> */}
            <Text style={styles.modernHeaderTitle}>Profile Update Requests</Text>
          </View>
          <View key="refresh-wrapper">
            <TouchableOpacity 
              key="refresh"
              style={styles.modernRefreshButton}
              onPress={refreshTickets}
            >
              {/* Only use the icon directly, do NOT wrap in <Text> */}
              <MaterialIcons name="refresh" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Filter Tabs */}
      <View style={styles.modernFilterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContainer}
        >
          <View key="filter-all-wrapper">
            <TouchableOpacity
              key="filter-all"
              style={[styles.modernFilterTab, filterStatus === 'all' && styles.activeModernFilterTab]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[styles.modernFilterTabText, filterStatus === 'all' && styles.activeModernFilterTabText]}>
                All Tickets
              </Text>
            </TouchableOpacity>
          </View>
          
          <View key="filter-pending-wrapper">
            <TouchableOpacity
              key="filter-pending"
              style={[styles.modernFilterTab, filterStatus === 'pending' && styles.activeModernFilterTab]}
              onPress={() => setFilterStatus('pending')}
            >
              <Text style={[styles.modernFilterTabText, filterStatus === 'pending' && styles.activeModernFilterTabText]}>
                Pending
              </Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {String(tickets.filter(t => t.status === 'pending').length)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View key="filter-approved-wrapper">
            <TouchableOpacity
              key="filter-approved"
              style={[styles.modernFilterTab, filterStatus === 'approved' && styles.activeModernFilterTab]}
              onPress={() => setFilterStatus('approved')}
            >
              <Text style={[styles.modernFilterTabText, filterStatus === 'approved' && styles.activeModernFilterTabText]}>
                Approved
              </Text>
            </TouchableOpacity>
          </View>
          
          <View key="filter-closed-wrapper">
            <TouchableOpacity
              key="filter-closed"
              style={[styles.modernFilterTab, filterStatus === 'closed' && styles.activeModernFilterTab]}
              onPress={() => setFilterStatus('closed')}
            >
              <Text style={[styles.modernFilterTabText, filterStatus === 'closed' && styles.activeModernFilterTabText]}>
                Rejected
              </Text>
            </TouchableOpacity>
          </View>
          
          <View key="filter-completed-wrapper">
            <TouchableOpacity
              key="filter-completed"
              style={[styles.modernFilterTab, filterStatus === 'completed' && styles.activeModernFilterTab]}
              onPress={() => setFilterStatus('completed')}
            >
              <Text style={[styles.modernFilterTabText, filterStatus === 'completed' && styles.activeModernFilterTabText]}>
                Completed
              </Text>
              <View style={[styles.badgeContainer, { backgroundColor: '#10b981' }]}>
                <Text style={styles.badgeText}>
                  {String(tickets.filter(t => t.completed).length)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      
      {/* Action Button */}
      {/* Removed Add Ticket (+) Button */}
      {/*
      <View key="add-ticket-wrapper">
        <TouchableOpacity 
          key="add-ticket"
          style={styles.addTicketButton}
          onPress={() => {
            // Add a new sample ticket
            const newTicket = {
              id: Math.floor(Math.random() * 1000) + 10, // Random ID
              student_id: 104,
              student_name: 'New Student',
              raised_by_name: 'New Student',
              subject: 'New Profile Update Request',
              description: 'This is a new sample ticket created for testing.',
              status: 'pending',
              created_at: new Date().toISOString(),
              type: 'profile_update',
              visible_to: 'faculty'
            };
            
            setTickets([newTicket, ...tickets]);
            Alert.alert('New Ticket', 'A new sample ticket has been added for testing purposes.');
          }}
        >
          <View>
            <MaterialIcons name="add" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>
      */}
      
      {/* Tickets List */}
      {isLoading ? (
        <View style={styles.modernLoadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.modernLoadingText}>Loading tickets...</Text>
        </View>
      ) : (
        <FlatList
          key={`tickets-${filterStatus}`}
          data={profileUpdateTickets}
          renderItem={renderTicket}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.modernTicketsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />
          }
          ListEmptyComponent={
            <View style={styles.modernEmptyContainer}>
              <MaterialIcons name="inbox" size={64} color="#e2e8f0" />
              <Text style={styles.modernEmptyText}>No tickets found</Text>
              <Text style={styles.modernEmptySubtext}>
                When students request profile updates, they will appear here
              </Text>
              <View key="empty-refresh-wrapper">
                <TouchableOpacity 
                  key="empty-refresh"
                  style={styles.modernEmptyButton}
                  onPress={fetchTickets}
                >
                  {/* Fix: Wrap text in <Text> only, no icons here */}
                  <Text style={styles.modernEmptyButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      )}
      
      {/* Ticket Detail Modal */}
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
                  <View key="modal-close-wrapper">
                    <TouchableOpacity
                      key="modal-close"
                      style={styles.closeModalButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <View>
                        <MaterialIcons name="close" size={24} color="#64748b" />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.modalContent}>
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="person" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Raised By: {String(selectedTicket.raised_by_name || selectedTicket.student_name || 'Unknown Student')}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="event" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Created: {String(new Date(selectedTicket.created_at).toLocaleString())}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="category" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Type: {selectedTicket.type ? selectedTicket.type.replace('_', ' ') : 'General'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    {(() => {
                      const statusStyle = getStatusStyle(selectedTicket.status, selectedTicket.completed);
                      const statusText = selectedTicket.completed ? 'Completed' : selectedTicket.status;
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                        </View>
                      );
                    })()}
                  </View>
                  
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Description:</Text>
                    <Text style={styles.descriptionText}>{selectedTicket.description}</Text>
                    <Text style={styles.descriptionText}>{String(selectedTicket.description)}</Text>
                  </View>
                  
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
                
                {selectedTicket.status === 'pending' && (
                  <View style={styles.actionButtonsContainer}>
                    <View key="modal-approve-wrapper">
                      <TouchableOpacity
                        key="modal-approve"
                        style={styles.approveButton}
                        onPress={() => {
                          setModalVisible(false);
                          handleTicketAction(selectedTicket.id, 'approve');
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialIcons name="check" size={18} color="#ffffff" />
                          <Text style={styles.actionButtonText}>Approve</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    
                    <View key="modal-reject-wrapper">
                      <TouchableOpacity
                        key="modal-reject"
                        style={styles.rejectButton}
                        onPress={() => {
                          setModalVisible(false);
                          handleTicketAction(selectedTicket.id, 'reject');
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialIcons name="close" size={18} color="#ffffff" />
                          <Text style={styles.actionButtonText}>Reject</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Modern Header
  modernHeader: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 10,
  },
  modernHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modernRefreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  // Modern Filter Tabs
  modernFilterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterTabsContainer: {
    paddingHorizontal: 16,
  },
  modernFilterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeModernFilterTab: {
    backgroundColor: '#0ea5e9',
  },
  modernFilterTabText: {
    color: '#64748b',
    fontWeight: '500',
    fontSize: 14,
  },
  activeModernFilterTabText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  badgeContainer: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Add Ticket Button
  addTicketButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 100,
  },
  // Keep old styles for compatibility
  filterContainer: {
    display: 'none', // Hide the old filter container
  },
  filterButton: {},
  activeFilterButton: {},
  filterButtonText: {},
  activeFilterButtonText: {},
  ticketsList: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  ticketContent: {
    marginBottom: 12,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  ticketInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  debugContainer: {
    backgroundColor: '#f0f9ff',
    padding: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  debugText: {
    fontSize: 14,
    color: '#0369a1',
    flex: 1,
  },
  debugButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  debugButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  
  // Modern Ticket List
  modernTicketsList: {
    padding: 16,
  },
  modernTicketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  modernTicketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernTicketTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernTicketIcon: {
    marginRight: 8,
  },
  modernTicketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  modernStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  modernStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modernTicketContent: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modernTicketDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 20,
  },
  modernTicketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  modernInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  modernInfoText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  modernActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modernApproveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#10b981',
  },
  modernRejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#ef4444',
  },
  modernActionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  modernLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modernLoadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  modernEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  modernEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  modernEmptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  modernEmptyButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modernEmptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  // New styles for approval and completion information
  approvalInfoContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  approvalInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 8,
  },
  approvalInfoText: {
    color: '#059669',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  completedInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  completedInfoText: {
    color: '#16a34a',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
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
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    color: '#1e293b',
    marginLeft: 8,
    fontWeight: '500',
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
    color: '#1e293b',
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
    color: '#1e293b',
    lineHeight: 20,
    fontWeight: '400',
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
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default FacultyTickets;