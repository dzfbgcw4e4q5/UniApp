# University Application Documentation

## Introduction

The University Application is a comprehensive platform designed to connect students, faculty, and administrators in a unified digital environment. This mobile application streamlines university processes including user authentication, profile management, attendance tracking, resume creation, task management, and real-time communication.

## System Architecture

The application follows a client-server architecture:

- **Frontend**: React Native mobile application using Expo
- **Backend**: Node.js Express server
- **Database**: MySQL database
- **Real-time Communication**: Socket.IO

## Installation and Setup

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the application
npm start
```

Required dependencies:
- React Native (^0.79.5)
- Expo (^53.0.19)
- React Navigation
- Axios for API requests
- Socket.IO client for real-time chat
- Various Expo packages for file handling, image picking, etc.

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

Required dependencies:
- Express (^4.21.2)
- MySQL2 (^3.14.1)
- Socket.IO (^4.8.1)
- Bcryptjs (^2.4.3)
- Jsonwebtoken (^9.0.2)
- Multer (^1.4.5-lts.1)
- Nodemailer (^7.0.5)
- PDFKit (^0.13.0)

## Core Features

### 1. Authentication System

#### Registration

The registration process allows new users to create accounts with role-based access:

**Frontend Implementation (Registration.js):**
```javascript
// Key state variables
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [role, setRole] = useState('student');
const [branch, setBranch] = useState('CSE');

// Registration handler
const handleRegister = async () => {
  try {
    setIsLoading(true);
    // Input validation
    // ...
    
    // API call to register user
    const response = await axios.post(
      `http://${IP}:3000/api/${role}/register`,
      { name, email, password, branch }
    );
    
    // Handle success
    Alert.alert('Registration Successful', 'You can now login with your credentials');
    navigation.navigate('Login');
  } catch (error) {
    // Error handling
  } finally {
    setIsLoading(false);
  }
};
```

**Backend Implementation (student.js):**
```javascript
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branch } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password for security
    const hashedPassword = await bcrypt.hash(password, 8);

    // Insert new user into database
    const [result] = await db.execute(
      'INSERT INTO students (name, email, password, branch, profile_edit) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, branch, false]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});
```

#### Login

The login system authenticates users and provides role-based access:

**Frontend Implementation (Login.js):**
```javascript
const handleLogin = async () => {
  try {
    setLoading(true);
    
    // Input validation
    // ...
    
    const roles = ['student', 'faculty', 'admin'];
    let loginSuccess = false;
    
    // Try logging in with each role until successful
    for (const role of roles) {
      try {
        const response = await apiService.login(email, password, role);

        if (response.data.token) {
          // Store authentication data
          await AsyncStorage.setItem('token', response.data.token);
          await AsyncStorage.setItem('userRole', role);
          await AsyncStorage.setItem('loginTime', Date.now().toString());

          // Navigate to appropriate dashboard
          navigation.replace(
            role === 'student'
              ? 'StudentDashboard'
              : role === 'faculty'
              ? 'FacultyDashboard'
              : 'AdminDashboard'
          );

          loginSuccess = true;
          break;
        }
      } catch (error) {
        // Continue trying other roles
      }
    }
    
    // Handle failed login
    if (!loginSuccess) {
      // Show appropriate error message
    }
  } catch (error) {
    // Error handling
  } finally {
    setLoading(false);
  }
};
```

**Backend Implementation (student.js):**
```javascript
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const student = rows[0];
    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: student.id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: 'student' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

#### Password Reset

The password reset flow uses email-based OTP verification:

**Frontend Implementation:**
- User enters email on ForgotPassword screen
- System sends OTP to the email
- User enters OTP and new password on ResetPassword screen

**Backend Implementation:**
```javascript
// Send OTP to email
router.post('/send-reset-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    // Check if user exists
    const [users] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'No user found with this email' });
    
    // Generate and store OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.execute('UPDATE students SET otp = ? WHERE email = ?', [otp, email]);
    
    // Send OTP via email
    await sendOTP(email, otp);
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Reset password using OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields required' });
    
    // Verify user and OTP
    const [users] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'No user found with this email' });
    const user = users[0];
    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 8);
    await db.execute('UPDATE students SET password = ?, otp = ? WHERE email = ?', [hashedPassword, otp, email]);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});
```

**Email Service (mailer.js):**
```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOTP(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Password Reset',
    text: `Your OTP for password reset is: ${otp}`,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendOTP };
```

### 2. User Dashboards

The application provides three distinct dashboards:

#### Student Dashboard

Features:
- Profile management
- Resume creation and management
- Attendance tracking
- Task management
- Chat with faculty

#### Faculty Dashboard

Features:
- Student management
- Attendance tracking
- Task assignment
- Ticket management
- Chat with students

#### Admin Dashboard

Features:
- User management (students and faculty)
- System configuration
- Reports and analytics

### 3. Profile Management

Users can manage their profiles including uploading profile photos:

**Frontend Implementation:**
```javascript
const pickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setPhoto(imageUri);
      await uploadProfilePhoto(imageUri);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to pick image');
  }
};

const uploadProfilePhoto = async (imageUri) => {
  try {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image';
    
    formData.append('photo', {
      uri: imageUri,
      name: filename,
      type,
    });

    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(
      `http://${IP}:3000/api/student/upload-photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      Alert.alert('Success', 'Profile photo updated successfully');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to upload profile photo');
  }
};
```

**Backend Implementation:**
```javascript
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const studentId = req.user.id;
    const uploadDir = path.resolve(__dirname, '../uploads/student', String(studentId));
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'student-' + req.user.id + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload profile photo
router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Save file path to database
    const photoPath = `/uploads/student/${req.user.id}/${req.file.filename}`;
    await db.execute(
      'UPDATE students SET photo = ? WHERE id = ?',
      [photoPath, req.user.id]
    );

    res.json({ 
      success: true, 
      message: 'Profile photo uploaded successfully',
      photoUrl: photoPath
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});
```

### 4. Real-time Chat

The application includes a real-time chat system using Socket.IO:

**Frontend Implementation:**
```javascript
// Socket.IO connection setup
useEffect(() => {
  const socket = io(`http://${IP}:3000`);
  setSocketInstance(socket);
  
  // Join chat room
  socket.emit('joinRoom', {
    senderId: userId,
    senderRole: userRole,
    recipientId: recipientId,
    recipientRole: recipientRole
  });
  
  // Listen for incoming messages
  socket.on('receiveMessage', (message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  });
  
  return () => {
    socket.disconnect();
  };
}, [userId, userRole, recipientId, recipientRole]);

// Send message function
const sendMessage = () => {
  if (!messageText.trim()) return;
  
  socketInstance.emit('sendMessage', {
    senderId: userId,
    senderRole: userRole,
    recipientId: recipientId,
    recipientRole: recipientRole,
    content: messageText,
    timestamp: new Date()
  });
  
  setMessageText('');
};
```

**Backend Implementation:**
```javascript
// Socket.IO setup
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join a room for a pair of users
  socket.on('joinRoom', ({ senderId, senderRole, recipientId, recipientRole }) => {
    // Room name is always sorted to ensure both users join the same room
    const room = [senderId, recipientId].sort().join('-');
    socket.join(room);
    console.log(`User ${senderId} (${senderRole}) joined room ${room}`);
  });

  // Handle sending a message
  socket.on('sendMessage', async (msg) => {
    const { senderId, senderRole, recipientId, recipientRole, content } = msg;
    
    // Save message to database
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
      io.to(room).emit('receiveMessage', messageData);
      
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

### 5. Resume Management

Students can create and manage their resumes with multiple template options:

**Frontend Implementation:**
```javascript
// Resume form state
const [resumeData, setResumeData] = useState({
  objective: '',
  education: '',
  skills: '',
  experience: '',
  projects: '',
  certifications: '',
  achievements: '',
  languages: '',
  references_info: '',
  additional_info: ''
});

// Template selection
const [selectedTemplate, setSelectedTemplate] = useState('classic');
const [selectedLayout, setSelectedLayout] = useState('single-column');

// Save resume data
const saveResume = async () => {
  try {
    setIsSaving(true);
    const token = await AsyncStorage.getItem('token');
    
    const response = await axios.post(
      `http://${IP}:3000/api/student/resume`,
      resumeData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success) {
      Alert.alert('Success', 'Resume saved successfully');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to save resume');
  } finally {
    setIsSaving(false);
  }
};

// Generate PDF preview
const generatePDF = async () => {
  try {
    setIsGenerating(true);
    const token = await AsyncStorage.getItem('token');
    
    const response = await axios.post(
      `http://${IP}:3000/api/student/generate-resume-pdf`,
      {
        template: selectedTemplate,
        layout: selectedLayout
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      }
    );
    
    // Save PDF to device and open preview
    const fileUri = FileSystem.documentDirectory + 'resume.pdf';
    await FileSystem.writeAsStringAsync(
      fileUri,
      response.data,
      { encoding: FileSystem.EncodingType.Base64 }
    );
    
    await Sharing.shareAsync(fileUri);
  } catch (error) {
    Alert.alert('Error', 'Failed to generate PDF');
  } finally {
    setIsGenerating(false);
  }
};
```

**Backend Implementation:**
```javascript
// Create or update resume
router.post('/resume', auth, async (req, res) => {
  try {
    const { 
      objective, education, skills, experience, projects, 
      certifications, achievements, languages, references_info, additional_info 
    } = req.body;
    
    // Check if resume already exists
    const [existingResume] = await db.execute(
      'SELECT * FROM resumes WHERE student_id = ?',
      [req.user.id]
    );
    
    if (existingResume.length > 0) {
      // Update existing resume
      await db.execute(
        `UPDATE resumes SET 
          objective = ?,
          education = ?, 
          skills = ?, 
          experience = ?, 
          projects = ?, 
          certifications = ?, 
          achievements = ?,
          languages = ?,
          references_info = ?,
          additional_info = ?,
          updated_at = NOW() 
        WHERE student_id = ?`,
        [
          objective, education, skills, experience, projects, 
          certifications, achievements, languages, references_info, 
          additional_info, req.user.id
        ]
      );
    } else {
      // Create new resume
      await db.execute(
        `INSERT INTO resumes (
          student_id, objective, education, skills, experience, 
          projects, certifications, achievements, languages,
          references_info, additional_info, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          req.user.id, objective, education, skills, experience, 
          projects, certifications, achievements, languages,
          references_info, additional_info
        ]
      );
    }
    
    res.json({ success: true, message: 'Resume saved successfully' });
  } catch (error) {
    console.error('Resume save error:', error);
    res.status(500).json({ error: 'Failed to save resume' });
  }
});

// Generate PDF resume
router.post('/generate-resume-pdf', auth, async (req, res) => {
  try {
    const { template, layout } = req.body;
    
    // Get student information
    const [students] = await db.execute(
      'SELECT name, email, branch FROM students WHERE id = ?',
      [req.user.id]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get resume data
    const [resumes] = await db.execute(
      'SELECT * FROM resumes WHERE student_id = ?',
      [req.user.id]
    );
    
    if (resumes.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    
    // Generate PDF using the utility function
    const pdfGenerator = require('../utils/pdfGenerator');
    pdfGenerator.generateResumePDF(resumes[0], students[0], res, template, layout);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});
```

**PDF Generator Implementation (pdfGenerator.js):**
```javascript
const PDFDocument = require('pdfkit');

function generateResumePDF(resumeData, studentInfo, stream, template = 'classic', layout = 'single-column') {
  // Create a new PDF document
  const doc = new PDFDocument({
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    size: 'A4'
  });
  
  // Pipe the PDF to the response
  doc.pipe(stream);
  
  // Set font and styling based on template
  const templateStyles = getTemplateStyles(template);
  
  // Add header with student name and contact info
  doc.font(templateStyles.headerFont)
     .fontSize(templateStyles.headerSize)
     .fillColor(templateStyles.primaryColor)
     .text(studentInfo.name, { align: 'center' });
     
  doc.font(templateStyles.bodyFont)
     .fontSize(templateStyles.contactSize)
     .fillColor(templateStyles.secondaryColor)
     .text(studentInfo.email, { align: 'center' });
  
  doc.moveDown(2);
  
  // Add resume sections based on layout
  if (layout === 'two-column') {
    generateTwoColumnLayout(doc, resumeData, templateStyles);
  } else {
    generateSingleColumnLayout(doc, resumeData, templateStyles);
  }
  
  // Finalize the PDF
  doc.end();
}

// Helper functions for different layouts and templates
function generateSingleColumnLayout(doc, resumeData, styles) {
  // Add each section of the resume
  addSection(doc, 'Objective', resumeData.objective, styles);
  addSection(doc, 'Education', resumeData.education, styles);
  addSection(doc, 'Skills', resumeData.skills, styles);
  addSection(doc, 'Experience', resumeData.experience, styles);
  addSection(doc, 'Projects', resumeData.projects, styles);
  addSection(doc, 'Certifications', resumeData.certifications, styles);
  addSection(doc, 'Achievements', resumeData.achievements, styles);
}

// Export the function
module.exports = { generateResumePDF };
```

### 6. Attendance Tracking

The application includes comprehensive attendance tracking for students:

**Frontend Implementation (AttendanceScreen.js):**
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IP } from '../../ip';
import { Ionicons } from '@expo/vector-icons';

const AttendanceScreen = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0
  });

  // Fetch attendance data
  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.get(
        `http://${IP}:3000/api/student/attendance`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setAttendance(response.data);
      
      // Calculate statistics
      const present = response.data.filter(item => item.status === 'present').length;
      const total = response.data.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      setStats({
        present,
        absent: total - present,
        total,
        percentage
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance (for self-marking or QR code scanning)
  const markAttendance = async (courseId, status) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      
      await axios.post(
        `http://${IP}:3000/api/student/attendance`,
        {
          date: today,
          status,
          course_id: courseId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      Alert.alert('Success', 'Attendance marked successfully');
      fetchAttendance(); // Refresh data
      
    } catch (error) {
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  // Render attendance statistics
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.percentage}%</Text>
        <Text style={styles.statLabel}>Attendance</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.present}</Text>
        <Text style={styles.statLabel}>Present</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.absent}</Text>
        <Text style={styles.statLabel}>Absent</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
    </View>
  );

  // Render attendance list
  const renderAttendanceItem = ({ item }) => (
    <View style={styles.attendanceItem}>
      <View style={styles.attendanceInfo}>
        <Text style={styles.courseName}>{item.course_name}</Text>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <View style={[
        styles.statusBadge, 
        { backgroundColor: item.status === 'present' ? '#10b981' : '#ef4444' }
      ]}>
        <Text style={styles.statusText}>
          {item.status === 'present' ? 'Present' : 'Absent'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Record</Text>
      {renderStats()}
      <FlatList
        data={attendance}
        renderItem={renderAttendanceItem}
        keyExtractor={item => `${item.id}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No attendance records found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc'
  },
  // Additional styles...
});

export default AttendanceScreen;
```

**Backend Implementation:**
```javascript
// Get student attendance
router.get('/attendance', auth, async (req, res) => {
  try {
    // Get all attendance records for the student
    const [attendance] = await db.execute(
      `SELECT a.*, c.name as course_name 
       FROM attendance a
       JOIN courses c ON a.course_id = c.id
       WHERE a.student_id = ?
       ORDER BY a.date DESC`,
      [req.user.id]
    );
    
    res.json(attendance);
  } catch (error) {
    console.error('Attendance fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Mark attendance
router.post('/attendance', auth, async (req, res) => {
  try {
    const { date, status, course_id } = req.body;
    
    // Check if attendance already marked for this date and course
    const [existingAttendance] = await db.execute(
      'SELECT * FROM attendance WHERE student_id = ? AND date = ? AND course_id = ?',
      [req.user.id, date, course_id]
    );
    
    if (existingAttendance.length > 0) {
      // Update existing attendance
      await db.execute(
        'UPDATE attendance SET status = ? WHERE student_id = ? AND date = ? AND course_id = ?',
        [status, req.user.id, date, course_id]
      );
    } else {
      // Create new attendance record
      await db.execute(
        'INSERT INTO attendance (student_id, date, status, course_id) VALUES (?, ?, ?, ?)',
        [req.user.id, date, status, course_id]
      );
    }
    
    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Faculty: Mark attendance for multiple students
router.post('/faculty/mark-attendance', auth, async (req, res) => {
  try {
    // Verify faculty role
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { date, course_id, attendanceData } = req.body;
    
    // attendanceData is an array of objects: [{ student_id, status }]
    for (const record of attendanceData) {
      const { student_id, status } = record;
      
      // Check if attendance already exists
      const [existing] = await db.execute(
        'SELECT * FROM attendance WHERE student_id = ? AND date = ? AND course_id = ?',
        [student_id, date, course_id]
      );
      
      if (existing.length > 0) {
        // Update existing record
        await db.execute(
          'UPDATE attendance SET status = ? WHERE student_id = ? AND date = ? AND course_id = ?',
          [status, student_id, date, course_id]
        );
      } else {
        // Create new record
        await db.execute(
          'INSERT INTO attendance (student_id, date, status, course_id) VALUES (?, ?, ?, ?)',
          [student_id, date, status, course_id]
        );
      }
    }
    
    res.json({ success: true, message: 'Attendance marked successfully for all students' });
  } catch (error) {
    console.error('Batch attendance marking error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});
```

### 7. Task Management

The application includes a task management system for assigning and tracking tasks:

**Frontend Implementation:**
```javascript
// Task list component
const TaskList = ({ tasks, onStatusChange }) => {
  const renderTaskItem = ({ item }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.taskDescription}>{item.description}</Text>
      
      <View style={styles.taskFooter}>
        <Text style={styles.dueDate}>
          Due: {new Date(item.due_date).toLocaleDateString()}
        </Text>
        
        {item.status !== 'completed' && (
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={() => onStatusChange(item.id, 'completed')}
          >
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <FlatList
      data={tasks}
      renderItem={renderTaskItem}
      keyExtractor={item => `${item.id}`}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No tasks found</Text>
      }
    />
  );
};

// Task creation (Faculty view)
const createTask = async () => {
  try {
    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    
    if (!taskDescription.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }
    
    if (!selectedStudents.length) {
      Alert.alert('Error', 'Please select at least one student');
      return;
    }
    
    setIsSubmitting(true);
    const token = await AsyncStorage.getItem('token');
    
    // Create tasks for each selected student
    for (const studentId of selectedStudents) {
      await axios.post(
        `http://${IP}:3000/api/faculty/tasks`,
        {
          title: taskTitle,
          description: taskDescription,
          due_date: dueDate.toISOString(),
          assigned_to: studentId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    }
    
    Alert.alert('Success', 'Tasks assigned successfully');
    setTaskTitle('');
    setTaskDescription('');
    setSelectedStudents([]);
    setModalVisible(false);
    
  } catch (error) {
    Alert.alert('Error', 'Failed to create tasks');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Backend Implementation:**
```javascript
// Create task (Faculty route)
router.post('/tasks', auth, async (req, res) => {
  try {
    const { title, description, due_date, assigned_to } = req.body;
    
    // Validate input
    if (!title || !description || !due_date || !assigned_to) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Create task
    const [result] = await db.execute(
      `INSERT INTO tasks (
        title, description, due_date, status, assigned_to, assigned_by, created_at
      ) VALUES (?, ?, ?, 'pending', ?, ?, NOW())`,
      [title, description, due_date, assigned_to, req.user.id]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Task created successfully',
      task_id: result.insertId
    });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get student tasks
router.get('/tasks', auth, async (req, res) => {
  try {
    const [tasks] = await db.execute(
      `SELECT t.*, f.name as assigned_by_name
       FROM tasks t
       JOIN faculty f ON t.assigned_by = f.id
       WHERE t.assigned_to = ?
       ORDER BY t.due_date ASC`,
      [req.user.id]
    );
    
    res.json(tasks);
  } catch (error) {
    console.error('Task fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Update task status
router.patch('/tasks/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Update task
    await db.execute(
      'UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ? AND assigned_to = ?',
      [status, id, req.user.id]
    );
    
    res.json({ success: true, message: 'Task status updated successfully' });
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});
```

### 8. Ticket System

The application includes a support ticket system:

**Frontend Implementation:**
```javascript
// Create ticket
const createTicket = async () => {
  try {
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject for your ticket');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description for your ticket');
      return;
    }
    
    setIsSubmitting(true);
    const token = await AsyncStorage.getItem('token');
    
    const response = await axios.post(
      `http://${IP}:3000/api/student/tickets`,
      {
        subject,
        description
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success) {
      setSubject('');
      setDescription('');
      setModalVisible(false);
      Alert.alert('Success', 'Your ticket has been submitted successfully');
      fetchTickets(); // Refresh ticket list
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to create ticket');
  } finally {
    setIsSubmitting(false);
  }
};

// View tickets
const renderTicketItem = ({ item }) => (
  <TouchableOpacity 
    style={styles.ticketItem}
    onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
  >
    <View style={styles.ticketHeader}>
      <Text style={styles.ticketSubject}>{item.subject}</Text>
      <View style={[
        styles.statusBadge,
        { backgroundColor: getStatusColor(item.status) }
      ]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
    
    <Text style={styles.ticketDescription} numberOfLines={2}>
      {item.description}
    </Text>
    
    <View style={styles.ticketFooter}>
      <Text style={styles.ticketDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  </TouchableOpacity>
);
```

**Backend Implementation:**
```javascript
// Create ticket
router.post('/tickets', auth, async (req, res) => {
  try {
    const { subject, description } = req.body;
    
    // Validate input
    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }
    
    // Create ticket
    const [result] = await db.execute(
      'INSERT INTO tickets (subject, description, raised_by, role, status) VALUES (?, ?, ?, "student", "open")',
      [subject, description, req.user.id]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Ticket created successfully',
      ticket_id: result.insertId
    });
  } catch (error) {
    console.error('Ticket creation error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get student tickets
router.get('/tickets', auth, async (req, res) => {
  try {
    const [tickets] = await db.execute(
      'SELECT * FROM tickets WHERE raised_by = ?',
      [req.user.id]
    );
    
    res.json(tickets || []);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Faculty: Get assigned tickets
router.get('/faculty/tickets', auth, async (req, res) => {
  try {
    const [tickets] = await db.execute(
      `SELECT t.*, s.name as student_name
       FROM tickets t
       JOIN students s ON t.raised_by = s.id
       WHERE t.assigned_to = ? OR t.assigned_to IS NULL
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Update ticket status
router.patch('/faculty/tickets/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;
    
    // Update ticket
    await db.execute(
      'UPDATE tickets SET status = ?, response = ?, updated_at = NOW() WHERE id = ?',
      [status, response, id]
    );
    
    res.json({ success: true, message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Ticket update error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});
```

## Database Structure

The application uses a MySQL database with the following main tables:

1. **students**: Stores student information
   ```sql
   CREATE TABLE students (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) NOT NULL UNIQUE,
     password VARCHAR(255) NOT NULL,
     branch VARCHAR(100) NOT NULL,
     photo VARCHAR(255),
     otp VARCHAR(6),
     profile_edit BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   ```

2. **faculty**: Stores faculty information
   ```sql
   CREATE TABLE faculty (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) NOT NULL UNIQUE,
     password VARCHAR(255) NOT NULL,
     department VARCHAR(100) NOT NULL,
     photo VARCHAR(255),
     otp VARCHAR(6),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   ```

3. **admin**: Stores admin information
   ```sql
   CREATE TABLE admin (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) NOT NULL UNIQUE,
     password VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   ```

4. **messages**: Stores chat messages
   ```sql
   CREATE TABLE messages (
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
   );
   ```

5. **resumes**: Stores student resumes
   ```sql
   CREATE TABLE resumes (
     id INT AUTO_INCREMENT PRIMARY KEY,
     student_id INT NOT NULL,
     objective TEXT,
     education TEXT,
     skills TEXT,
     experience TEXT,
     projects TEXT,
     certifications TEXT,
     achievements TEXT,
     languages TEXT,
     references_info TEXT,
     additional_info TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
   );
   ```

6. **attendance**: Stores attendance records
   ```sql
   CREATE TABLE attendance (
     id INT AUTO_INCREMENT PRIMARY KEY,
     student_id INT NOT NULL,
     date DATE NOT NULL,
     status ENUM('present', 'absent') NOT NULL,
     course_id INT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
     FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
     UNIQUE KEY unique_attendance (student_id, date, course_id)
   );
   ```

7. **tasks**: Stores tasks assigned to students
   ```sql
   CREATE TABLE tasks (
     id INT AUTO_INCREMENT PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     description TEXT NOT NULL,
     due_date DATETIME NOT NULL,
     status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
     assigned_to INT NOT NULL,
     assigned_by INT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     FOREIGN KEY (assigned_to) REFERENCES students(id) ON DELETE CASCADE,
     FOREIGN KEY (assigned_by) REFERENCES faculty(id) ON DELETE CASCADE
   );
   ```

8. **tickets**: Stores support tickets
   ```sql
   CREATE TABLE tickets (
     id INT AUTO_INCREMENT PRIMARY KEY,
     subject VARCHAR(255) NOT NULL,
     description TEXT NOT NULL,
     status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
     raised_by INT NOT NULL,
     role ENUM('student', 'faculty', 'admin') NOT NULL,
     assigned_to INT,
     response TEXT,
     approved_by INT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   ```

## Security Considerations

1. **Authentication**: JWT-based authentication with token expiration
2. **Password Security**: Passwords are hashed using bcrypt
3. **Input Validation**: All user inputs are validated on both client and server
4. **File Upload Security**: File uploads are restricted by type and size
5. **Environment Variables**: Sensitive information is stored in environment variables

## Conclusion

The University Application provides a comprehensive digital platform for university management, connecting students, faculty, and administrators in a unified environment. The application's modular architecture allows for easy maintenance and future expansion.