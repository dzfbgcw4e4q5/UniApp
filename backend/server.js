const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const IP = require('./ip');
const pool = require('./db');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust as needed for security
    methods: ['GET', 'POST']
  }
});



// --- WhatsApp-like Chat: Save and Broadcast Messages ---
const db = require('./db');
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join a room for a pair of users (student/faculty)
  socket.on('joinRoom', ({ senderId, senderRole, recipientId, recipientRole }) => {
    // Room name is always sorted to ensure both users join the same room
    const room = [senderId, recipientId].sort().join('-');
    socket.join(room);
    console.log(`User ${senderId} (${senderRole}) joined room ${room}`);
  });

  // Handle sending a message
  socket.on('sendMessage', async (msg) => {
    const { senderId, senderRole, recipientId, recipientRole, content, timestamp } = msg;
    console.log('Received message via socket:', {
      senderId,
      senderRole,
      recipientId,
      recipientRole,
      content: content ? content.substring(0, 50) + '...' : 'empty'
    });
    
    // Save message to DB
    try {
      const [result] = await db.execute(
        `INSERT INTO messages (
          sender_id, 
          sender_role, 
          receiver_id, 
          receiver_role, 
          content, 
          timestamp, 
          is_read, 
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), 0, NOW(), NOW())`,
        [senderId, senderRole, recipientId, recipientRole, content]
      );
      
      // Get the saved message with user details
      const [messageResults] = await db.execute(
        `SELECT 
          m.*,
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
        WHERE m.id = ?`,
        [result.insertId]
      );
      
      // Broadcast to both users in the room
      const room = [senderId, recipientId].sort().join('-');
      const messageData = messageResults[0];
      console.log(`Broadcasting message to room ${room}:`, messageData);
      io.to(room).emit('receiveMessage', messageData);
      
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// REST API: Fetch conversation between two users

// Test database connection and create tables if needed
pool.getConnection()
   .then(async conn => {
     console.log('Database connected successfully');
     
     // Create resume table if it doesn't exist
     try {
       await pool.execute(`
         CREATE TABLE IF NOT EXISTS resumes (
           id INT AUTO_INCREMENT PRIMARY KEY,
           student_id INT NOT NULL,
           education TEXT,
           skills TEXT,
           experience TEXT,
           projects TEXT,
           certifications TEXT,
           achievements TEXT,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
           FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
         )
       `);
       console.log('Resume table created or verified successfully');
     } catch (error) {
       console.error('Error creating resume table:', error);
     }

     // Create messages table if it doesn't exist
     try {
       await pool.execute(`
         CREATE TABLE IF NOT EXISTS messages (
           id INT AUTO_INCREMENT PRIMARY KEY,
           sender_id INT NOT NULL,
           sender_role ENUM('student', 'faculty', 'admin') NOT NULL,
           receiver_id INT NOT NULL,
           receiver_role ENUM('student', 'faculty', 'admin') NOT NULL,
           content TEXT NOT NULL,
           timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           is_read BOOLEAN DEFAULT FALSE,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
           INDEX idx_sender (sender_id, sender_role),
           INDEX idx_receiver (receiver_id, receiver_role),
           INDEX idx_timestamp (timestamp),
           INDEX idx_conversation (sender_id, receiver_id, sender_role, receiver_role)
         )
       `);
       console.log('Messages table created or verified successfully');
     } catch (error) {
       console.error('Error creating messages table:', error);
     }
     
     conn.release();
   })
   .catch(err => {
     console.error('Database connection failed:', err);
   });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
const uploadsPath = path.resolve(__dirname, 'uploads');
console.log('Serving static files from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Import routes
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Use routes
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 3000;

// Start the server with Socket.io
server.listen(PORT, IP, () => {
  console.log(`Server running on http://${IP}:${PORT}`);
  console.log(`Socket.io server running on port ${PORT}`);
});