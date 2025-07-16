# University App - Complete Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Installation & Setup](#installation--setup)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [Dashboard Systems](#dashboard-systems)
7. [Feature Implementations](#feature-implementations)
8. [File Upload & Storage](#file-upload--storage)
9. [Email System](#email-system)
10. [API Endpoints](#api-endpoints)
11. [Frontend Components](#frontend-components)
12. [Real-time Communication](#real-time-communication)

---

## Introduction

### What is University App?
The University App is a comprehensive digital platform designed to streamline academic operations and enhance communication between students, faculty, and administrators. It serves as a centralized hub for managing academic activities, assignments, attendance, resume generation, and real-time communication.

### Key Features:
- **Multi-User System**: Separate dashboards for Students, Faculty, and Administrators
- **Authentication**: Secure login with OTP verification and password reset
- **Resume Management**: Multiple templates for resume generation
- **Task Management**: Assignment and task tracking system
- **Attendance System**: Digital attendance marking and tracking
- **Ticketing System**: Support ticket management
- **Real-time Chat**: Instant messaging between users
- **File Management**: Profile photo uploads and document storage

### Technology Stack:
- **Frontend**: React Native with Expo
- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Multer for local file uploads
- **Email**: Nodemailer for email services
- **Real-time Communication**: Socket.io
- **PDF Generation**: PDFKit for resume generation

---

## System Architecture

### Project Structure
```
Uni App/
├── backend/
│   ├── server.js              # Main server file
│   ├── db.js                  # Database connection
│   ├── routes/
│   │   ├── admin.js           # Admin routes
│   │   ├── faculty.js         # Faculty routes
│   │   ├── student.js         # Student routes
│   │   └── chat.js            # Chat routes
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── utils/
│   │   ├── mailer.js          # Email utilities
│   │   └── pdfGenerator.js    # PDF generation utilities
│   └── uploads/               # File storage directory
├── frontend/
│   ├── App.js                 # Main app component
│   ├── screens/               # Screen components
│   ├── components/            # Reusable components
│   ├── contexts/              # Context providers
│   ├── services/              # API services
│   └── utils/                 # Utility functions
```

---

## Installation & Setup

### Backend Dependencies
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",        // Password hashing
    "cors": "^2.8.5",            // Cross-origin resource sharing
    "dotenv": "^16.5.0",         // Environment variables
    "express": "^4.21.2",        // Web framework
    "jsonwebtoken": "^9.0.2",    // JWT authentication
    "multer": "^1.4.5-lts.1",    // File uploads
    "mysql2": "^3.14.1",         // MySQL database driver
    "nodemailer": "^7.0.5",      // Email sending
    "pdfkit": "^0.13.0",         // PDF generation
    "socket.io": "^4.8.1"        // Real-time communication
  }
}
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "@expo/vector-icons": "^14.1.0",              // Icons
    "@react-native-async-storage/async-storage": "^2.1.2",  // Local storage
    "@react-native-community/datetimepicker": "^8.4.1",     // Date picker
    "@react-navigation/bottom-tabs": "^7.3.12",             // Bottom navigation
    "@react-navigation/drawer": "^7.5.2",                   // Drawer navigation
    "@react-navigation/native": "^7.1.8",                   // Navigation
    "@react-navigation/stack": "^7.3.1",                    // Stack navigation
    "axios": "^1.9.0",                                      // HTTP client
    "expo": "^53.0.19",                                     // Expo framework
    "expo-image-picker": "^16.1.4",                         // Image picker
    "expo-document-picker": "~13.1.6",                      // Document picker
    "expo-file-system": "~18.1.11",                         // File system
    "expo-print": "~14.1.4",                                // PDF printing
    "react-native": "^0.79.5",                              // React Native
    "socket.io-client": "^4.8.1"                            // Socket.io client
  }
}
```

### Installation Steps

#### Backend Setup:
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (if needed)
touch .env

# Start the server
npm start
```

#### Frontend Setup:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

---

## Database Schema

### Database Connection (backend/db.js)
```javascript
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'university_app'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Database connected successfully');
});

module.exports = db;
```

### Table Structures

#### Users Table (Multi-role users)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'faculty', 'admin') NOT NULL,
  branch VARCHAR(100),
  profile_photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Resume Table
```sql
CREATE TABLE resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  objective TEXT,
  experience TEXT,
  education TEXT,
  skills TEXT,
  projects TEXT,
  languages TEXT,
  certifications TEXT,
  achievements TEXT,
  additional_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Messages Table (Chat system)
```sql
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);
```

#### Tasks Table
```sql
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_by INT NOT NULL,
  assigned_to INT NOT NULL,
  due_date DATE,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

#### Tickets Table
```sql
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT NOT NULL,
  assigned_to INT,
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

#### Attendance Table
```sql
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL,
  marked_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (marked_by) REFERENCES users(id)
);
```

---

## Authentication System

### JWT Authentication Middleware (backend/middleware/auth.js)
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
```

### Registration System

#### Backend Route (backend/routes/student.js)
```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registration endpoint
router.post('/register', async (req, res) => {
  const { name, email, password, branch, role = 'student' } = req.body;

  try {
    // Check if user already exists
    const checkUser = 'SELECT * FROM users WHERE email = ?';
    db.query(checkUser, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const insertUser = 'INSERT INTO users (name, email, password, branch, role) VALUES (?, ?, ?, ?, ?)';
      db.query(insertUser, [name, email, hashedPassword, branch, role], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to create user' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: result.insertId, email, role },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: {
            id: result.insertId,
            name,
            email,
            branch,
            role
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

#### Frontend Registration (frontend/screens/Registration.js)
```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';

const Registration = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    branch: '',
    role: 'student'
  });

  const handleRegister = async () => {
    try {
      const response = await axios.post('http://your-server:3000/api/students/register', formData);
      
      if (response.data.token) {
        // Save token to AsyncStorage
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.user));
        
        Alert.alert('Success', 'Registration successful!');
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.name}
        onChangeText={(text) => setFormData({...formData, name: text})}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => setFormData({...formData, email: text})}
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={formData.password}
        onChangeText={(text) => setFormData({...formData, password: text})}
        secureTextEntry
      />
      
      <TextInput
        style={styles.input}
        placeholder="Branch"
        value={formData.branch}
        onChangeText={(text) => setFormData({...formData, branch: text})}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Login System

#### Backend Login Route
```javascript
// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = results[0];
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branch: user.branch,
          profile_photo: user.profile_photo
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

### Password Reset System

#### Forgot Password with OTP
```javascript
const nodemailer = require('nodemailer');

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate OTP
      const otp = generateOTP();
      otpStore.set(email, {
        otp,
        timestamp: Date.now(),
        attempts: 0
      });

      // Send OTP via email
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP - University App',
        html: `
          <h2>Password Reset OTP</h2>
          <p>Your OTP for password reset is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 10 minutes.</p>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({ message: 'OTP sent to your email' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  const storedOTP = otpStore.get(email);
  
  if (!storedOTP) {
    return res.status(400).json({ error: 'OTP not found or expired' });
  }

  // Check if OTP is expired (10 minutes)
  const isExpired = Date.now() - storedOTP.timestamp > 10 * 60 * 1000;
  
  if (isExpired) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (storedOTP.otp !== otp) {
    storedOTP.attempts++;
    if (storedOTP.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'Too many failed attempts' });
    }
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  // OTP verified successfully
  otpStore.delete(email);
  res.json({ message: 'OTP verified successfully' });
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
    db.query(updateQuery, [hashedPassword, email], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'Password reset successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

---

## Dashboard Systems

### Student Dashboard Features

#### Student Dashboard Screen (frontend/screens/students/StudentDashboard.js)
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const StudentDashboard = () => {
  const navigation = useNavigation();
  const [studentData, setStudentData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    loadStudentData();
    loadTasks();
    loadAttendance();
  }, []);

  const loadStudentData = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        setStudentData(JSON.parse(userInfo));
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get('http://your-server:3000/api/students/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadAttendance = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get('http://your-server:3000/api/students/attendance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendance(response.data.attendance);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {studentData?.name}!
        </Text>
        <Text style={styles.subText}>
          Branch: {studentData?.branch}
        </Text>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('ResumeManagement')}
        >
          <Text style={styles.menuText}>Resume Management</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('TaskList')}
        >
          <Text style={styles.menuText}>Tasks ({tasks.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('AttendanceView')}
        >
          <Text style={styles.menuText}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('TicketSystem')}
        >
          <Text style={styles.menuText}>Support Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('ChatList')}
        >
          <Text style={styles.menuText}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.menuText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Pending Tasks</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {attendance.filter(a => a.status === 'present').length}
          </Text>
          <Text style={styles.statLabel}>Days Present</Text>
        </View>
      </View>
    </ScrollView>
  );
};
```

### Faculty Dashboard Features

#### Faculty Dashboard Screen (frontend/screens/faculty/FacultyDashboard.js)
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const FacultyDashboard = () => {
  const navigation = useNavigation();
  const [facultyData, setFacultyData] = useState(null);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadFacultyData();
    loadStudents();
    loadTasks();
  }, []);

  const loadFacultyData = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        setFacultyData(JSON.parse(userInfo));
      }
    } catch (error) {
      console.error('Error loading faculty data:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get('http://your-server:3000/api/faculty/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get('http://your-server:3000/api/faculty/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, Prof. {facultyData?.name}!
        </Text>
        <Text style={styles.subText}>
          Department: {facultyData?.branch}
        </Text>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('StudentManagement')}
        >
          <Text style={styles.menuText}>Student Management</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('TaskAssignment')}
        >
          <Text style={styles.menuText}>Assign Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('AttendanceMarking')}
        >
          <Text style={styles.menuText}>Mark Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('ResumeReview')}
        >
          <Text style={styles.menuText}>Review Resumes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('ChatList')}
        >
          <Text style={styles.menuText}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.menuText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{students.length}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Tasks Assigned</Text>
        </View>
      </View>
    </ScrollView>
  );
};
```

### Admin Dashboard Features

#### Admin Dashboard Screen (frontend/screens/admin/AdminDashboard.js)
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AdminDashboard = () => {
  const navigation = useNavigation();
  const [adminData, setAdminData] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalTasks: 0,
    totalTickets: 0
  });

  useEffect(() => {
    loadAdminData();
    loadStats();
  }, []);

  const loadAdminData = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        setAdminData(JSON.parse(userInfo));
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get('http://your-server:3000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Admin Dashboard
        </Text>
        <Text style={styles.subText}>
          Welcome, {adminData?.name}!
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalFaculty}</Text>
          <Text style={styles.statLabel}>Total Faculty</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalTasks}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalTickets}</Text>
          <Text style={styles.statLabel}>Support Tickets</Text>
        </View>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('UserManagement')}
        >
          <Text style={styles.menuText}>User Management</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('SystemReports')}
        >
          <Text style={styles.menuText}>System Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('TicketManagement')}
        >
          <Text style={styles.menuText}>Ticket Management</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.menuText}>System Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
```

---

## Feature Implementations

### Profile Photo Implementation

#### Backend File Upload (backend/routes/student.js)
```javascript
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userRole = req.user.role;
    const uploadPath = `uploads/${userRole}`;
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const userId = req.user.userId;
    const extension = path.extname(file.originalname);
    const filename = `profile_${userId}_${Date.now()}${extension}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Profile photo upload endpoint
router.post('/upload-profile-photo', authenticateToken, upload.single('profilePhoto'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    const photoPath = req.file.path;

    // Update user's profile photo in database
    const updateQuery = 'UPDATE users SET profile_photo = ? WHERE id = ?';
    db.query(updateQuery, [photoPath, userId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'Profile photo uploaded successfully',
        photoPath: photoPath
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get profile photo endpoint
router.get('/profile-photo/:userId', (req, res) => {
  const userId = req.params.userId;
  
  const query = 'SELECT profile_photo FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const photoPath = results[0].profile_photo;
    if (!photoPath) {
      return res.status(404).json({ error: 'No profile photo found' });
    }

    // Send the file
    res.sendFile(path.resolve(photoPath));
  });
});
```

#### Frontend Photo Upload (frontend/screens/Profile.js)
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Profile = () => {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    loadUserInfo();
    loadProfilePhoto();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        setUserInfo(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadProfilePhoto = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(
        `http://your-server:3000/api/students/profile-photo/${userInfo?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const photoUrl = URL.createObjectURL(response.data);
      setProfilePhoto(photoUrl);
    } catch (error) {
      console.error('Error loading profile photo:', error);
    }
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const formData = new FormData();
      formData.append('profilePhoto', {
        uri: imageAsset.uri,
        type: imageAsset.type || 'image/jpeg',
        name: 'profile-photo.jpg',
      });

      const response = await axios.post(
        'http://your-server:3000/api/students/upload-profile-photo',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.message) {
        Alert.alert('Success', 'Profile photo updated successfully');
        setProfilePhoto(imageAsset.uri);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload profile photo');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.photoContainer}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderText}>No Photo</Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Name:</Text>
        <Text style={styles.infoValue}>{userInfo?.name}</Text>
        
        <Text style={styles.infoLabel}>Email:</Text>
        <Text style={styles.infoValue}>{userInfo?.email}</Text>
        
        <Text style={styles.infoLabel}>Branch:</Text>
        <Text style={styles.infoValue}>{userInfo?.branch}</Text>
        
        <Text style={styles.infoLabel}>Role:</Text>
        <Text style={styles.infoValue}>{userInfo?.role}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profilePhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#ddd',
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  changePhotoBtn: {
    marginTop: 10,
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  changePhotoText: {
    color: 'white',
    fontSize: 16,
  },
  infoContainer: {
    marginTop: 20,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  infoValue: {
    fontSize: 16,
    marginTop: 5,
    color: '#333',
  },
});
```

### Resume Management System

#### Backend Resume Routes (backend/routes/student.js)
```javascript
// Create or update resume
router.post('/resume', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const {
    objective,
    experience,
    education,
    skills,
    projects,
    languages,
    certifications,
    achievements,
    additional_info
  } = req.body;

  // Check if resume exists
  const checkQuery = 'SELECT * FROM resumes WHERE user_id = ?';
  db.query(checkQuery, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      // Update existing resume
      const updateQuery = `
        UPDATE resumes SET 
        objective = ?, experience = ?, education = ?, skills = ?, 
        projects = ?, languages = ?, certifications = ?, achievements = ?, 
        additional_info = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `;
      
      db.query(updateQuery, [
        objective, experience, education, skills,
        projects, languages, certifications, achievements,
        additional_info, userId
      ], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update resume' });
        }
        res.json({ message: 'Resume updated successfully' });
      });
    } else {
      // Create new resume
      const insertQuery = `
        INSERT INTO resumes (
          user_id, objective, experience, education, skills,
          projects, languages, certifications, achievements, additional_info
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(insertQuery, [
        userId, objective, experience, education, skills,
        projects, languages, certifications, achievements, additional_info
      ], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to create resume' });
        }
        res.json({ message: 'Resume created successfully' });
      });
    }
  });
});

// Get resume
router.get('/resume', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = 'SELECT * FROM resumes WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ resume: results[0] });
  });
});

// Generate resume PDF
router.post('/generate-resume-pdf', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { template = 'classic' } = req.body;

  // Get resume data
  const resumeQuery = 'SELECT * FROM resumes WHERE user_id = ?';
  db.query(resumeQuery, [userId], (err, resumeResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (resumeResults.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Get student info
    const studentQuery = 'SELECT * FROM users WHERE id = ?';
    db.query(studentQuery, [userId], (err, studentResults) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (studentResults.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const resumeData = resumeResults[0];
      const studentInfo = studentResults[0];

      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${studentInfo.name}_resume.pdf"`);

      // Generate PDF using the utility function
      try {
        const { generateResumePDF } = require('../utils/pdfGenerator');
        generateResumePDF(resumeData, studentInfo, res, template);
      } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
      }
    });
  });
});
```

#### Frontend Resume Management (frontend/screens/students/ResumeManagement.js)
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Picker } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const ResumeManagement = () => {
  const [resumeData, setResumeData] = useState({
    objective: '',
    experience: '',
    education: '',
    skills: '',
    projects: '',
    languages: '',
    certifications: '',
    achievements: '',
    additional_info: ''
  });
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadResumeData();
  }, []);

  const loadResumeData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get('http://your-server:3000/api/students/resume', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.resume) {
        setResumeData(response.data.resume);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
    }
  };

  const saveResume = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await axios.post(
        'http://your-server:3000/api/students/resume',
        resumeData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      Alert.alert('Success', 'Resume saved successfully!');
    } catch (error) {
      console.error('Error saving resume:', error);
      Alert.alert('Error', 'Failed to save resume');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await axios.post(
        'http://your-server:3000/api/students/generate-resume-pdf',
        { template: selectedTemplate },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Save PDF to device
      const pdfUri = FileSystem.documentDirectory + 'resume.pdf';
      await FileSystem.writeAsStringAsync(pdfUri, response.data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri);
      }

      Alert.alert('Success', 'Resume PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Resume Management</Text>

      <View style={styles.templateSelector}>
        <Text style={styles.label}>Select Template:</Text>
        <Picker
          selectedValue={selectedTemplate}
          onValueChange={setSelectedTemplate}
          style={styles.picker}
        >
          <Picker.Item label="Classic" value="classic" />
          <Picker.Item label="Executive" value="executive" />
          <Picker.Item label="Minimalist" value="minimalist" />
          <Picker.Item label="Creative" value="creative" />
        </Picker>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Objective:</Text>
        <TextInput
          style={styles.textArea}
          value={resumeData.objective}
          onChangeText={(text) => setResumeData({...resumeData, objective: text})}
          placeholder="Enter your career objective..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Experience:</Text>
        <TextInput
          style={styles.textArea}
          value={resumeData.experience}
          onChangeText={(text) => setResumeData({...resumeData, experience: text})}
          placeholder="Enter your work experience..."
          multiline
          numberOfLines={6}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Education:</Text>
        <TextInput
          style={styles.textArea}
          value={resumeData.education}
          onChangeText={(text) => setResumeData({...resumeData, education: text})}
          placeholder="Enter your educational background..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Skills:</Text>
        <TextInput
          style={styles.textArea}
          value={resumeData.skills}
          onChangeText={(text) => setResumeData({...resumeData, skills: text})}
          placeholder="Enter your skills..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Projects:</Text>
        <TextInput
          style={styles.textArea}
          value={resumeData.projects}
          onChangeText={(text) => setResumeData({...resumeData, projects: text})}
          placeholder="Enter your projects..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Languages:</Text>
        <TextInput
          style={styles.textArea}
          value={resumeData.languages}
          onChangeText={(text) => setResumeData({...resumeData, languages: text})}
          placeholder="Enter languages you know..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Certifications:</Text>
        <TextInput
          style={styles.textArea}
          value={resumeData.certifications}
          onChangeText={(text) => setResumeData({...resumeData, certifications: text})}
          placeholder="Enter your certifications..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Achievements:</Text>
        <TextInput
          style={styles.textArea}
          value={resumeData.achievements}
          onChangeText={(text) => setResumeData({...resumeData, achievements: text})}
          placeholder="Enter your achievements..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Additional Information:</Text>
        <TextInput
          style={styles.textArea}
          value={resumeData.additional_info}
          onChangeText={(text) => setResumeData({...resumeData, additional_info: text})}
          placeholder="Any additional information..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={saveResume}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Save Resume'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.pdfButton]} 
          onPress={generatePDF}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Generating...' : 'Generate PDF'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  templateSelector: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: 'white',
  },
  formGroup: {
    marginBottom: 20,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  pdfButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

