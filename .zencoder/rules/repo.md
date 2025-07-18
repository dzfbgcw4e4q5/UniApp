---
description: Repository Information Overview
alwaysApply: true
---

# University Application Information

## Summary
A comprehensive university management application with separate interfaces for students, faculty, and administrators. The application consists of a React Native frontend and a Node.js Express backend, featuring real-time chat functionality, student profile management, resume creation, and attendance tracking.

## Structure
- **frontend/**: React Native mobile application using Expo
- **backend/**: Node.js Express server with MySQL database
- **.vscode/**: VS Code configuration files
- **.zencoder/**: Documentation and rules

## Projects

### Frontend (React Native Mobile App)
**Configuration File**: frontend/package.json

#### Language & Runtime
**Language**: JavaScript (React Native)
**Version**: React 19.0.0, React Native 0.79.5
**Build System**: Expo
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- expo (^53.0.19): React Native development platform
- react-navigation: Navigation library with stack, drawer, and tab navigators
- axios (^1.9.0): HTTP client for API requests
- socket.io-client (^4.8.1): Real-time communication
- expo-document-picker, expo-image-picker: File handling
- react-native-gesture-handler, react-native-reanimated: UI interactions

#### Build & Installation
```bash
cd frontend
npm install
npm start
```

#### Usage
The frontend provides different interfaces for:
- Students: Profile management, resume creation, attendance tracking, chat
- Faculty: Dashboard, ticket management, student interactions, chat
- Administrators: User management, system configuration

### Backend (Node.js Server)
**Configuration File**: backend/package.json

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Version**: Node.js (Express 4.21.2)
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- express (^4.21.2): Web framework
- mysql2 (^3.14.1): MySQL database client
- socket.io (^4.8.1): Real-time communication
- bcryptjs (^2.4.3): Password hashing
- jsonwebtoken (^9.0.2): Authentication
- multer (^1.4.5-lts.1): File uploads
- nodemailer (^7.0.5): Email sending
- pdfkit (^0.13.0): PDF generation

#### Build & Installation
```bash
cd backend
npm install
npm start
```

#### Database
**Type**: MySQL
**Configuration**: Environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
**Main Tables**: students, faculty, admin, messages, resumes

#### API Endpoints
- **/api/student**: Student-related operations
- **/api/faculty**: Faculty-related operations
- **/api/admin**: Admin-related operations
- **/api/chat**: Chat functionality

#### Real-time Features
The backend implements Socket.IO for real-time chat functionality between students and faculty, with message persistence in the database.