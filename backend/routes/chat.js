const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const pool = require('../db');

// Test route to check if chat routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Chat routes are working!', timestamp: new Date() });
});

// Get all faculty members for students
router.get('/faculty', auth, async (req, res) => {
  try {
    console.log('GET /api/chat/faculty called by user:', req.user);
    
    // Verify user is a student
    if (req.user.role !== 'student') {
      console.log('Access denied - user is not a student:', req.user.role);
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = `
      SELECT 
        id, 
        name, 
        email,
        'faculty' as role,
        'offline' as status
      FROM faculty 
      ORDER BY name
    `;

    console.log('Executing query:', query);
    const [results] = await pool.execute(query);
    console.log('Query results:', results);
    res.json(results);
  } catch (error) {
    console.error('Error in /faculty route:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all students for faculty
router.get('/students', auth, async (req, res) => {
  try {
    console.log('GET /api/chat/students called by user:', req.user);
    
    // Verify user is faculty
    if (req.user.role !== 'faculty') {
      console.log('Access denied - user is not faculty:', req.user.role);
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = `
      SELECT 
        id, 
        name, 
        email, 
        branch,
        'student' as role,
        'offline' as status
      FROM students 
      ORDER BY name
    `;

    console.log('Executing query:', query);
    const [results] = await pool.execute(query);
    console.log('Query results:', results);
    res.json(results);
  } catch (error) {
    console.error('Error in /students route:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get chat history between two users
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    console.log('Fetching chat history between:', {
      currentUserId,
      currentUserRole,
      recipientId: userId
    });

    const query = `
      SELECT 
        m.id,
        m.sender_id,
        m.sender_role,
        m.receiver_id,
        m.receiver_role,
        m.content,
        m.timestamp,
        m.is_read,
        m.created_at,
        m.updated_at,
        CASE 
          WHEN m.sender_role = 'student' THEN sender_s.name 
          ELSE sender_f.name 
        END as sender_name,
        CASE 
          WHEN m.receiver_role = 'student' THEN receiver_s.name 
          ELSE receiver_f.name 
        END as receiver_name
      FROM messages m
      LEFT JOIN students sender_s ON m.sender_id = sender_s.id AND m.sender_role = 'student'
      LEFT JOIN faculty sender_f ON m.sender_id = sender_f.id AND m.sender_role = 'faculty'
      LEFT JOIN students receiver_s ON m.receiver_id = receiver_s.id AND m.receiver_role = 'student'
      LEFT JOIN faculty receiver_f ON m.receiver_id = receiver_f.id AND m.receiver_role = 'faculty'
      WHERE 
        (m.sender_id = ? AND m.sender_role = ? AND m.receiver_id = ?) OR 
        (m.sender_id = ? AND m.receiver_id = ? AND m.receiver_role = ?)
      ORDER BY m.created_at ASC
    `;

    const [results] = await pool.execute(query, [
      currentUserId, currentUserRole, userId, 
      userId, currentUserId, currentUserRole
    ]);
    
    // Mark messages as read when fetching history
    if (results.length > 0) {
      await pool.execute(
        `UPDATE messages 
         SET is_read = 1, updated_at = NOW() 
         WHERE receiver_id = ? AND receiver_role = ? AND sender_id = ? AND is_read = 0`,
        [currentUserId, currentUserRole, userId]
      );
      console.log('Marked messages as read for user:', currentUserId);
    }
    
    console.log('Chat history results:', results.length, 'messages');
    res.json(results);
  } catch (error) {
    console.error('Error in /history route:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { receiver_id, receiver_role, content } = req.body;
    const sender_id = req.user.id;
    const sender_role = req.user.role;

    console.log('Sending message:', {
      sender_id,
      sender_role,
      receiver_id,
      receiver_role,
      content: content ? content.substring(0, 50) + '...' : 'empty'
    });

    if (!receiver_id || !receiver_role || !content) {
      return res.status(400).json({ 
        message: 'Receiver ID, receiver role, and message content are required' 
      });
    }

    const query = `
      INSERT INTO messages (
        sender_id, 
        sender_role, 
        receiver_id, 
        receiver_role, 
        content, 
        timestamp, 
        is_read, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), 0, NOW(), NOW())
    `;

    const [results] = await pool.execute(query, [
      sender_id, 
      sender_role, 
      receiver_id, 
      receiver_role, 
      content
    ]);
    
    // Get the inserted message with user details
    const getMessageQuery = `
      SELECT 
        m.id,
        m.sender_id,
        m.sender_role,
        m.receiver_id,
        m.receiver_role,
        m.content,
        m.timestamp,
        m.is_read,
        m.created_at,
        m.updated_at,
        CASE 
          WHEN m.sender_role = 'student' THEN sender_s.name 
          ELSE sender_f.name 
        END as sender_name,
        CASE 
          WHEN m.receiver_role = 'student' THEN receiver_s.name 
          ELSE receiver_f.name 
        END as receiver_name
      FROM messages m
      LEFT JOIN students sender_s ON m.sender_id = sender_s.id AND m.sender_role = 'student'
      LEFT JOIN faculty sender_f ON m.sender_id = sender_f.id AND m.sender_role = 'faculty'
      LEFT JOIN students receiver_s ON m.receiver_id = receiver_s.id AND m.receiver_role = 'student'
      LEFT JOIN faculty receiver_f ON m.receiver_id = receiver_f.id AND m.receiver_role = 'faculty'
      WHERE m.id = ?
    `;

    const [messageResults] = await pool.execute(getMessageQuery, [results.insertId]);
    console.log('Message sent successfully:', messageResults[0]);
    res.json(messageResults[0]);
  } catch (error) {
    console.error('Error in /send route:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get recent conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END as other_user_id,
        CASE 
          WHEN m.sender_id = ? THEN receiver.name 
          ELSE sender.name 
        END as other_user_name,
        CASE 
          WHEN m.sender_id = ? THEN receiver.email 
          ELSE sender.email 
        END as other_user_email,
        CASE 
          WHEN m.sender_id = ? THEN receiver.role 
          ELSE sender.role 
        END as other_user_role,
        m.message as last_message,
        m.created_at as last_message_time,
        COUNT(CASE WHEN m.receiver_id = ? AND m.read_at IS NULL THEN 1 END) as unread_count
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY 
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END
      ORDER BY m.created_at DESC
    `;

    const [results] = await pool.execute(query, [userId, userId, userId, userId, userId, userId, userId, userId]);
    res.json(results);
  } catch (error) {
    console.error('Error in /conversations route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark messages as read
router.post('/mark-read', auth, async (req, res) => {
  try {
    const { senderId, senderRole } = req.body;
    const receiverId = req.user.id;
    const receiverRole = req.user.role;

    console.log('Marking messages as read:', {
      senderId,
      senderRole,
      receiverId,
      receiverRole
    });

    await pool.execute(
      `UPDATE messages 
       SET is_read = 1, updated_at = NOW() 
       WHERE sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ? AND is_read = 0`,
      [senderId, senderRole, receiverId, receiverRole]
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;