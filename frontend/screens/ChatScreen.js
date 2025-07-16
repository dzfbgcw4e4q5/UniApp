import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';

import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { IP } from '../ip';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#7c3aed', // Vivid purple
  secondary: '#f3e8ff', // Light purple
  background: '#f8fafc',
  card: '#fff',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  success: '#22c55e',
  myMessage: 'rgba(124,58,237,0.95)', // purple
  theirMessage: '#fff',
  myMessageText: '#fff',
  theirMessageText: '#7c3aed',
  online: '#22c55e',
  offline: '#94a3b8',
  inputBar: '#fff',
  inputShadow: '#a78bfa',
};

const ChatScreen = ({ route, navigation }) => {
  const { recipientId, recipientRole, recipientName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeChat();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const initializeChat = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userRole = await AsyncStorage.getItem('userRole');
      
      console.log('ChatScreen - Auth check:', {
        hasToken: !!token,
        userRole: userRole,
        tokenLength: token ? token.length : 0
      });
      
      if (!token || !userRole) {
        console.log('ChatScreen - Missing auth data:', { token: !!token, userRole: !!userRole });
        Alert.alert('Error', 'Authentication required');
        navigation.goBack();
        return;
      }

      // Extract user ID from JWT token
      let userId;
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        // Base64 decode the payload
        const base64Payload = tokenParts[1];
        const payload = JSON.parse(atob(base64Payload));
        userId = payload.id;
        console.log('Extracted userId from token:', userId);
        
        if (!userId) {
          throw new Error('No user ID found in token');
        }
      } catch (e) {
        console.error('Error decoding token:', e);
        Alert.alert('Error', 'Invalid token');
        navigation.goBack();
        return;
      }

      // Get user profile
      const response = await fetch(`http://${IP}:3000/api/${userRole}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await response.json();
      setUserProfile({ ...profile, role: userRole, id: parseInt(userId) });

      // Initialize socket connection
      const newSocket = io(`http://${IP}:3000`);
      setSocket(newSocket);

      // Join room for this conversation
      newSocket.emit('joinRoom', {
        senderId: parseInt(userId),
        senderRole: userRole,
        recipientId: parseInt(recipientId),
        recipientRole: recipientRole,
      });

      // Listen for incoming messages
      newSocket.on('receiveMessage', (message) => {
        setMessages(prev => [...prev, message]);
        setTimeout(() => scrollToBottom(), 100);
      });

      // Listen for user status
      newSocket.on('userStatus', (status) => {
        setIsOnline(status.isOnline);
      });

      // Fetch chat history
      await fetchChatHistory(parseInt(userId), userRole);
      
      // Mark messages as read when chat opens
      await markMessagesAsRead(parseInt(recipientId), recipientRole);

    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatHistory = async (userId, userRole) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `http://${IP}:3000/api/chat/history/${recipientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const history = await response.json();
      setMessages(history);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const markMessagesAsRead = async (senderId, senderRole) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`http://${IP}:3000/api/chat/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId: senderId,
          senderRole: senderRole,
        }),
      });
      console.log('Messages marked as read for sender:', senderId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending || !socket || !userProfile) return;

    setIsSending(true);
    try {
      const messageData = {
        senderId: userProfile.id,
        senderRole: userProfile.role,
        recipientId: parseInt(recipientId),
        recipientRole: recipientRole,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      console.log('Sending message:', messageData);

      // Emit message via socket
      socket.emit('sendMessage', messageData);

      // Don't add to local messages immediately - let the socket response handle it
      setNewMessage('');
      
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === userProfile?.id || item.sender_id === userProfile?.id;
    const showTime = index === messages.length - 1 || 
      (index < messages.length - 1 && 
       new Date(item.timestamp || item.created_at).getTime() - new Date(messages[index + 1].timestamp || messages[index + 1].created_at).getTime() > 60000);

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.theirMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.message || item.content}
          </Text>
        </View>
        {showTime && (
          <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.theirMessageTime]}>
            {formatMessageTime(item.timestamp || item.created_at)}
          </Text>
        )}
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.avatarText}>
              {recipientName ? recipientName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.online : COLORS.offline }]} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerName}>{recipientName || 'Unknown User'}</Text>
          <Text style={styles.headerStatus}>
            {isOnline ? 'Online' : 'Offline'} • {recipientRole}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderInputBar = () => (
    <View style={styles.inputContainer}>
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.muted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, { opacity: newMessage.trim() ? 1 : 0.5 }]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={COLORS.card} />
          ) : (
            <MaterialIcons name="send" size={24} color={COLORS.card} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </SafeAreaView>
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
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Animated.View style={[styles.messagesContainer, { opacity: fadeAnim }]}> 
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => `${item.id || index}`}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollToBottom()}
            />
          </Animated.View>
          {renderInputBar()}
        </KeyboardAvoidingView>
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
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.card,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 2,
    shadowColor: COLORS.inputShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 3,
  },
  myMessage: {
    backgroundColor: COLORS.myMessage,
    borderTopRightRadius: 6,
  },
  theirMessage: {
    backgroundColor: COLORS.theirMessage,
    borderTopLeftRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.inputShadow,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: COLORS.myMessageText,
    fontWeight: '500',
  },
  theirMessageText: {
    color: COLORS.theirMessageText,
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 8,
    opacity: 0.7,
  },
  myMessageTime: {
    color: COLORS.muted,
    textAlign: 'right',
  },
  theirMessageTime: {
    color: COLORS.muted,
    textAlign: 'left',
  },
  inputContainer: {
    backgroundColor: 'transparent',
    padding: 0,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.inputBar,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 48,
    width: '96%',
    shadowColor: COLORS.inputShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 100,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    shadowColor: COLORS.inputShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 2,
  },
});

export default ChatScreen;