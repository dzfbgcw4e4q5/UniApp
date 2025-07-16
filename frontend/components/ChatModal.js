import React, { useState, useEffect, useContext } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import io from 'socket.io-client';
import apiService from '../services/apiService';
import { IP } from '../ip';

const socket = io(`http://${IP}:3000`); // Update with your backend URL/port

const ChatModal = ({ visible, onClose, recipientRole, recipientId }) => {

  const { user } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Guard: don't render if user or recipient is missing
  if (!user || !recipientId || !recipientRole) return null;

  useEffect(() => {
    socket.emit('joinRoom', { senderId: user.id, recipientId, recipientRole });
    socket.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.off('receiveMessage');
    };
  }, [user.id, recipientId, recipientRole]);

  useEffect(() => {
    // Fetch chat history from backend (correct endpoint)
    apiService.get(`/api/messages?user1_id=${user.id}&user1_role=${user.role}&user2_id=${recipientId}&user2_role=${recipientRole}`)
      .then(res => setMessages(res.data))
      .catch(() => {});
  }, [user.id, user.role, recipientId, recipientRole]);

  const sendMessage = () => {
    if (!message.trim()) return;
    const msg = {
      sender_id: user.id,
      sender_role: user.role,
      receiver_id: recipientId,
      receiver_role: recipientRole,
      content: message,
      timestamp: new Date().toISOString(),
    };
    socket.emit('sendMessage', msg);
    setMessages((prev) => [...prev, msg]);
    setMessage('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.header}>Chat</Text>
        <FlatList
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => {
            // Support both camelCase and snake_case for sender/receiver
            const senderId = item.senderId || item.sender_id;
            return (
              <View style={[styles.message, senderId === user.id ? styles.myMessage : styles.theirMessage]}>
                <Text>{item.content}</Text>
                <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
              </View>
            );
          }}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  message: { padding: 8, borderRadius: 8, marginVertical: 4, maxWidth: '80%' },
  myMessage: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end' },
  theirMessage: { backgroundColor: '#ECECEC', alignSelf: 'flex-start' },
  timestamp: { fontSize: 10, color: '#888', marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, padding: 10, marginRight: 8 },
  sendButton: { backgroundColor: '#007AFF', borderRadius: 20, padding: 10 },
  sendText: { color: '#fff', fontWeight: 'bold' },
  closeButton: { marginTop: 10, alignSelf: 'center' },
  closeText: { color: '#007AFF', fontWeight: 'bold' },
});

export default ChatModal;
