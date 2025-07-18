const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const adminId = req.user.id;
    const uploadDir = path.join(__dirname, '../uploads/admin', String(adminId));
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'admin-' + req.user.id + '-' + uniqueSuffix + ext);
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const { sendOTP } = require('../utils/mailer');

// --- OTP Password Reset ---
// Send OTP to email
router.post('/send-reset-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const [users] = await db.execute('SELECT * FROM admin WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'No user found with this email' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.execute('UPDATE admin SET otp = ? WHERE email = ?', [otp, email]);
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
    const [users] = await db.execute('SELECT * FROM admin WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'No user found with this email' });
    const user = users[0];
    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    const hashedPassword = await bcrypt.hash(newPassword, 8);
    await db.execute('UPDATE admin SET password = ?, otp = ? WHERE email = ?', [hashedPassword, otp, email]);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  console.log('Admin test endpoint hit');
  res.json({ message: 'Admin API is working' });
});

// Register admin
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    const [result] = await db.execute(
      'INSERT INTO admin (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM admin WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: 'admin' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users
router.get('/users', auth, async (req, res) => {
  try {
    const [students] = await db.execute('SELECT id, name, email, branch, profile_edit FROM students');
    const [faculty] = await db.execute('SELECT id, name, email, branch FROM faculty');
    
    res.json({ students, faculty });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks
router.get('/tasks', auth, async (req, res) => {
  try {
    const [tasks] = await db.execute('SELECT * FROM tasks');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tickets
router.get('/tickets', auth, async (req, res) => {
  try {
    console.log('Admin tickets endpoint called');
    
    // First, check if the tickets table exists
    try {
      // Use a simple query to check if the tickets table exists
      const [result] = await db.execute('SHOW TABLES LIKE "tickets"');
      
      if (result.length === 0) {
        // Tickets table doesn't exist, create it
        console.log('Tickets table does not exist, creating it...');
        await db.execute(`
          CREATE TABLE IF NOT EXISTS tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            subject VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(50),
            raised_by INT NOT NULL,
            role VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL,
            response TEXT,
            requested_updates TEXT,
            approved_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log('Tickets table created successfully');
        
        // Return empty array since table was just created
        return res.json([]);
      }
      
      // Check if approved_by column exists
      const [approvedByColumns] = await db.execute('SHOW COLUMNS FROM tickets LIKE "approved_by"');
      
      if (approvedByColumns.length === 0) {
        // Add approved_by column
        console.log('Adding approved_by column to tickets table');
        await db.execute('ALTER TABLE tickets ADD COLUMN approved_by INT');
      }
      
      // Check if visible_to column exists
      const [visibleToColumns] = await db.execute('SHOW COLUMNS FROM tickets LIKE "visible_to"');
      
      if (visibleToColumns.length === 0) {
        // Add visible_to column
        console.log('Adding visible_to column to tickets table');
        await db.execute('ALTER TABLE tickets ADD COLUMN visible_to VARCHAR(50) DEFAULT "admin"');
        
        // Update existing profile_update tickets to be visible to faculty
        await db.execute(
          'UPDATE tickets SET visible_to = "admin,faculty" WHERE type = "profile_update"'
        );
      }
      
      const [tickets] = await db.execute(
        'SELECT t.*, s.name AS raised_by_name, ' +
        'a.name as admin_approver_name, f.name as faculty_approver_name ' +
        'FROM tickets t ' +
        'LEFT JOIN students s ON t.raised_by = s.id ' +
        'LEFT JOIN admin a ON t.approved_by = a.id ' +
        'LEFT JOIN faculty f ON t.approved_by = f.id ' +
        'ORDER BY t.created_at DESC'
      );
      
      // Process tickets to add approver info and ensure requested_updates is properly formatted
      const processedTickets = tickets.map(ticket => {
        let approverInfo = null;
        
        if (ticket.admin_approver_name) {
          approverInfo = {
            name: ticket.admin_approver_name,
            role: 'admin'
          };
        } else if (ticket.faculty_approver_name) {
          approverInfo = {
            name: ticket.faculty_approver_name,
            role: 'faculty'
          };
        }
        
        // Ensure requested_updates is properly formatted JSON string
        let requestedUpdates = ticket.requested_updates;
        
        console.log('Processing ticket', ticket.id, 'requested_updates:', requestedUpdates, 'type:', typeof requestedUpdates);
        
        if (requestedUpdates) {
          if (typeof requestedUpdates === 'string') {
            try {
              // Try to parse and re-stringify to ensure valid JSON
              JSON.parse(requestedUpdates);
            } catch (e) {
              console.error('Invalid JSON in requested_updates for ticket', ticket.id, ':', requestedUpdates);
              // If parsing fails, create a default message
              requestedUpdates = JSON.stringify({
                message: "Student has requested permission to update their profile information. Specific changes will be made once approved."
              });
            }
          } else if (typeof requestedUpdates === 'object') {
            // If it's already an object, stringify it
            console.log('Converting object to string for ticket', ticket.id);
            requestedUpdates = JSON.stringify(requestedUpdates);
          } else {
            console.log('Unexpected type for requested_updates:', typeof requestedUpdates);
            requestedUpdates = JSON.stringify({
              message: "Student has requested permission to update their profile information. Specific changes will be made once approved."
            });
          }
        } else {
          // If no requested_updates, provide default
          requestedUpdates = JSON.stringify({
            message: "Student has requested permission to update their profile information. Specific changes will be made once approved."
          });
        }
        
        return {
          ...ticket,
          approver: approverInfo,
          requested_updates: requestedUpdates,
          // Remove redundant fields
          admin_approver_name: undefined,
          faculty_approver_name: undefined
        };
      });
      
      console.log(`Retrieved ${tickets.length} tickets for admin`);
      res.json(processedTickets);
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({ message: 'Database error: ' + dbError.message });
    }
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Failed to fetch tickets: ' + error.message });
  }
});

// Handle profile update ticket (approve or reject)
router.put('/profile-update-tickets/:id', auth, async (req, res) => {
  try {
    const { action, approved_by_type = 'admin' } = req.body; // 'approve' or 'reject'
    const ticketId = req.params.id;
    const adminId = req.user.id;

    // Fetch ticket to get raised_by
    const [tickets] = await db.execute(
      'SELECT raised_by FROM tickets WHERE id = ? AND type = "profile_update"',
      [ticketId]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];

    if (action === 'approve') {
      // Update ticket status to approved and set approved_by and approved_by_type
      await db.execute(
        'UPDATE tickets SET status = ?, response = ?, approved_by = ?, approved_by_type = ?, completed = ? WHERE id = ?',
        ['approved', 'Profile update approved by admin', adminId, approved_by_type, false, ticketId]
      );
    } else if (action === 'reject') {
      // Update ticket status to closed and reset profile_edit
      await db.execute(
        'UPDATE tickets SET status = ?, response = ?, approved_by = ?, approved_by_type = ? WHERE id = ?',
        ['closed', 'Profile update rejected by admin', adminId, approved_by_type, ticketId]
      );
      await db.execute(
        'UPDATE students SET profile_edit = ? WHERE id = ?',
        [false, ticket.raised_by]
      );
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Resolve ticket
router.put('/tickets/:id/resolve', auth, async (req, res) => {
  try {
    const { status, response } = req.body;
    const [result] = await db.execute(
      'UPDATE tickets SET status = ?, response = ? WHERE id = ?',
      [status, response, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign task to faculty
router.post('/assign-faculty-task', auth, async (req, res) => {
  try {
    const { faculty_id, title, description, due_date } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO tasks (title, description, assigned_by, assigned_to, assigned_role, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, req.user.id, faculty_id, 'faculty', 'pending', due_date]
    );

    res.status(201).json({ success: true, task_id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Refresh token endpoint
router.post('/refresh-token', auth, async (req, res) => {
  try {
    // Verify that the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Generate a new token with the same user information
    const token = jwt.sign(
      { id: req.user.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get admin profile
router.get('/profile', auth, async (req, res) => {
  try {
    // Verify that the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const [rows] = await db.execute('SELECT id, name, email, photo FROM admin WHERE id = ?', [req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // If photo exists, construct the full URL
    if (rows[0].photo) {
      // Check if the photo is a full URL or just a filename
      if (!rows[0].photo.startsWith('http')) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        rows[0].photo = `${baseUrl}/uploads/admin/${rows[0].photo}`;
      }
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload profile photo
router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    console.log('Upload photo endpoint hit');
    
    // Verify that the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File uploaded successfully:', req.file.filename);

    // Get the filename and relative path
    const adminId = req.user.id;
    const filename = path.basename(req.file.filename);
    const relativePath = `${adminId}/${filename}`;
    
    // Get the current photo to delete it if it exists
    const [currentPhoto] = await db.execute(
      'SELECT photo FROM admin WHERE id = ?',
      [adminId]
    );
    // Delete the old photo file if it exists
    if (currentPhoto.length > 0 && currentPhoto[0].photo) {
      const oldPhotoPath = path.join(__dirname, '../uploads/admin', currentPhoto[0].photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }
    // Update the admin record with the new photo relative path
    await db.execute(
      'UPDATE admin SET photo = ? WHERE id = ?',
      [relativePath, adminId]
    );
    // Construct the full URL to the uploaded file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const photoUrl = `${baseUrl}/uploads/admin/${relativePath}`;

    res.json({ 
      success: true, 
      message: 'Profile photo uploaded successfully',
      photo: photoUrl
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove profile photo
router.post('/remove-photo', auth, async (req, res) => {
  try {
    // Verify that the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get the current photo
    const [currentPhoto] = await db.execute(
      'SELECT photo FROM admin WHERE id = ?',
      [req.user.id]
    );
    
    // If no photo exists, return success
    if (currentPhoto.length === 0 || !currentPhoto[0].photo) {
      return res.json({ 
        success: true, 
        message: 'No profile photo to remove'
      });
    }
    
    // Delete the photo file
    const photoPath = path.join(__dirname, '../uploads/admin', currentPhoto[0].photo);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
    
    // Update the admin record to remove the photo reference
    await db.execute(
      'UPDATE admin SET photo = NULL WHERE id = ?',
      [req.user.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Profile photo removed successfully'
    });
  } catch (error) {
    console.error('Error removing profile photo:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;