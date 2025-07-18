const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { sendOTP } = require('../utils/mailer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create a directory specific to the faculty ID
    const facultyId = req.user ? req.user.id : 'temp';
    const uploadDir = path.join(__dirname, '../uploads/faculty', String(facultyId));
    
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
    cb(null, 'faculty-' + req.user.id + '-' + uniqueSuffix + ext);
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

// --- OTP Password Reset ---
// Send OTP to email
router.post('/send-reset-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const [users] = await db.execute('SELECT * FROM faculty WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'No user found with this email' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.execute('UPDATE faculty SET otp = ? WHERE email = ?', [otp, email]);
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
    const [users] = await db.execute('SELECT * FROM faculty WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'No user found with this email' });
    const user = users[0];
    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    const hashedPassword = await bcrypt.hash(newPassword, 8);
    await db.execute('UPDATE faculty SET password = ?, otp = ? WHERE email = ?', [hashedPassword, otp, email]);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Register faculty
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branch } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    const [result] = await db.execute(
      'INSERT INTO faculty (name, email, password, branch) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, branch]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login faculty
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM faculty WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const faculty = rows[0];
    const isMatch = await bcrypt.compare(password, faculty.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: faculty.id, role: 'faculty' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: 'faculty' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// Get faculty profile
router.get('/profile', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, branch, created_at, updated_at, photo FROM faculty WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // If photo exists, construct the full URL
    if (rows[0].photo) {
      // Check if the photo is a full URL or just a filename
      if (!rows[0].photo.startsWith('http')) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        // Only add /uploads/ if not already present
        let photoPath = rows[0].photo;
        if (photoPath.startsWith('faculty/')) {
          // Already has faculty/3/filename.jpg
          rows[0].photo = `${baseUrl}/uploads/${photoPath}`;
        } else {
          // Just a filename, add faculty/<id>/
          rows[0].photo = `${baseUrl}/uploads/faculty/${req.user.id}/${photoPath}`;
        }
      }
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign task to student
router.post('/assign-task', auth, async (req, res) => {
  const { title, description, student_id, due_date } = req.body;

  if (!title || !description || !student_id || !due_date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // First, verify that the student exists
    const [studentRows] = await db.execute(
      'SELECT id FROM students WHERE id = ?',
      [student_id]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Insert task with assigned_by field
    await db.execute(
      'INSERT INTO tasks (title, description, assigned_to, assigned_role, status, due_date, assigned_by) VALUES (?, ?, ?, "student", "pending", ?, ?)',
      [title, description, student_id, due_date, req.user.id]
    );
    res.status(201).json({ message: 'Task assigned successfully' });
  } catch (error) {
    console.error('Task assignment error:', error);
    res.status(500).json({ 
      error: 'Failed to assign task', 
      details: error.message 
    });
  }
});

// Assign task to self (faculty)
router.post('/assign-self-task', auth, async (req, res) => {
  const { title, description, due_date } = req.body;
  const faculty_id = req.user.id;

  if (!title || !description || !due_date) {
    return res.status(400).json({ error: 'Title, description, and due date are required' });
  }

  try {
    console.log(`Faculty ${faculty_id} assigning task to self with data:`, req.body);
    
    // Insert task with faculty as both assigner and assignee
    await db.execute(
      'INSERT INTO tasks (title, description, assigned_to, assigned_role, status, due_date, assigned_by) VALUES (?, ?, ?, "faculty", "pending", ?, ?)',
      [title, description, faculty_id, due_date, faculty_id]
    );
    
    res.status(201).json({ message: 'Task assigned to self successfully' });
  } catch (error) {
    console.error('Self task assignment error:', error);
    res.status(500).json({ 
      error: 'Failed to assign task to self', 
      details: error.message 
    });
  }
});



// Get list of tasks assigned to students or self
router.get('/tasks', auth, async (req, res) => {
  try {
    const taskType = req.query.type || 'assigned'; // 'assigned' or 'self'
    const faculty_id = req.user.id;
    
    console.log(`Fetching ${taskType} tasks for faculty ID: ${faculty_id}`);
    
    let query, params;
    
    if (taskType === 'self') {
      // Get self-assigned tasks (tasks assigned to the faculty)
      query = 'SELECT t.*, f.name AS faculty_name FROM tasks t LEFT JOIN faculty f ON t.assigned_to = f.id WHERE t.assigned_role = "faculty" AND t.assigned_to = ?';
      params = [faculty_id];
    } else {
      // Get tasks assigned to students by this faculty (default)
      query = 'SELECT t.*, s.name AS student_name FROM tasks t LEFT JOIN students s ON t.assigned_to = s.id WHERE t.assigned_role = "student" AND t.assigned_by = ?';
      params = [faculty_id];
    }
    
    const [tasks] = await db.execute(query, params);
    
    // Log the first task for debugging
    if (tasks.length > 0) {
      console.log(`Faculty API - First ${taskType} task details:`, JSON.stringify(tasks[0], null, 2));
    } else {
      console.log(`No ${taskType} tasks found for faculty ID: ${faculty_id}`);
    }
    
    res.json(tasks || []); // Return empty array if no tasks
  } catch (error) {
    console.error(`Error fetching ${req.query.type || 'assigned'} tasks:`, error);
    res.status(500).json({ error: error.message });
  }
});



// Get list of self-assigned tasks (tasks assigned to faculty themselves)
router.get('/self-tasks', auth, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    console.log(`Fetching self-assigned tasks for faculty ID: ${faculty_id}`);
    
    const [tasks] = await db.execute(
      'SELECT t.*, f.name AS faculty_name FROM tasks t LEFT JOIN faculty f ON t.assigned_to = f.id WHERE t.assigned_role = "faculty" AND t.assigned_to = ?',
      [faculty_id]
    );
    
    // Log the first task for debugging
    if (tasks.length > 0) {
      console.log('Faculty API - First self-assigned task details:', JSON.stringify(tasks[0], null, 2));
    } else {
      console.log('No self-assigned tasks found for faculty ID:', faculty_id);
    }
    
    res.json(tasks || []); // Return empty array if no tasks
  } catch (error) {
    console.error('Error fetching self-assigned tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific task's details
router.get('/tasks/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log(`Fetching details for task ID: ${taskId}`);
    
    const [tasks] = await db.execute(
      'SELECT t.*, s.name AS student_name FROM tasks t LEFT JOIN students s ON t.assigned_to = s.id WHERE t.id = ? AND t.assigned_by = ?',
      [taskId, req.user.id]
    );
    
    if (tasks.length === 0) {
      console.log(`Task not found or not assigned by faculty ID: ${req.user.id}`);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('Task details:', JSON.stringify(tasks[0], null, 2));
    res.json(tasks[0]);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get list of students
router.get('/students', auth, async (req, res) => {
  try {
    const [students] = await db.execute('SELECT id, name FROM students');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh token endpoint
router.post('/refresh-token', auth, async (req, res) => {
  try {
    // Generate a new token with the same user information
    const token = jwt.sign(
      { id: req.user.id, role: 'faculty' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get list of self-assigned tasks (tasks assigned to faculty themselves)
router.get('/self-tasks', auth, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    console.log(`Fetching self-assigned tasks for faculty ID: ${faculty_id}`);
    
    const [tasks] = await db.execute(
      'SELECT t.*, f.name AS faculty_name FROM tasks t LEFT JOIN faculty f ON t.assigned_to = f.id WHERE t.assigned_role = "faculty" AND t.assigned_to = ?',
      [faculty_id]
    );
    
    // Log the first task for debugging
    if (tasks.length > 0) {
      console.log('Faculty API - First self-assigned task details:', JSON.stringify(tasks[0], null, 2));
    } else {
      console.log('No self-assigned tasks found for faculty ID:', faculty_id);
    }
    
    res.json(tasks || []); // Return empty array if no tasks
  } catch (error) {
    console.error('Error fetching self-assigned tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific self-assigned task's details
router.get('/self-tasks/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const faculty_id = req.user.id;
    
    console.log(`Fetching self-assigned task ${taskId} for faculty ${faculty_id}`);
    
    // Get task details
    const [tasks] = await db.execute(
      'SELECT t.*, f.name AS faculty_name FROM tasks t LEFT JOIN faculty f ON t.assigned_to = f.id WHERE t.id = ? AND t.assigned_to = ? AND t.assigned_role = "faculty"',
      [taskId, faculty_id]
    );
    
    if (tasks.length === 0) {
      console.log(`Self-assigned task ${taskId} not found for faculty ${faculty_id}`);
      return res.status(404).json({ error: 'Self-assigned task not found' });
    }
    
    console.log(`Found self-assigned task:`, JSON.stringify(tasks[0], null, 2));
    res.json(tasks[0]);
  } catch (error) {
    console.error('Error fetching self-assigned task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update self-assigned task status
router.put('/self-tasks/:id/status', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    const faculty_id = req.user.id;
    
    console.log(`Faculty ${faculty_id} updating self-assigned task ${taskId} status to ${status}`);
    
    if (!status || !['pending', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Verify the task exists and is assigned to this faculty
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND assigned_to = ? AND assigned_role = "faculty"',
      [taskId, faculty_id]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }
    
    // Update the task status
    await db.execute(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, taskId]
    );
    
    console.log(`Self-assigned task ${taskId} status updated to ${status}`);
    
    res.json({ 
      success: true, 
      message: 'Self-assigned task status updated successfully',
      task_id: taskId,
      new_status: status
    });
  } catch (error) {
    console.error('Error updating self-assigned task status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update self-assigned task link
router.put('/self-tasks/:id/link', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { link } = req.body;
    const faculty_id = req.user.id;
    
    console.log(`Faculty ${faculty_id} updating self-assigned task ${taskId} link`);
    console.log(`New link: ${link}`);
    
    // Verify the task exists and is assigned to this faculty
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND assigned_to = ? AND assigned_role = "faculty"',
      [taskId, faculty_id]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }
    
    // Update the task link
    const [updateResult] = await db.execute(
      'UPDATE tasks SET link = ? WHERE id = ?',
      [link, taskId]
    );
    
    console.log(`Self-assigned task ${taskId} link updated`);
    console.log('Update result:', JSON.stringify(updateResult, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Self-assigned task link updated successfully',
      task_id: taskId
    });
  } catch (error) {
    console.error('Error updating self-assigned task link:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark self-assigned task as complete
router.patch('/self-tasks/:id/complete', auth, async (req, res) => {
  const { id } = req.params;
  console.log(`Attempting to mark task ${id} as complete for user ${req.user.id}`);
  
  try {
    // First check if the task exists and is assigned to this user
    const [tasks] = await db.query(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );
    
    if (tasks.length === 0) {
      console.log(`Task ${id} not found`);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = tasks[0];
    
    // Check if the task is assigned to the current user
    // Convert both to numbers for comparison to avoid type mismatch
    if (Number(task.assigned_to) !== Number(req.user.id)) {
      console.log(`Task ${id} is assigned to user ${task.assigned_to} (${typeof task.assigned_to}), not to the current user ${req.user.id} (${typeof req.user.id})`);
      return res.status(403).json({ error: 'You can only complete tasks assigned to you' });
    }
    
    // Update the task status
    console.log(`Executing UPDATE query: UPDATE tasks SET status = 'completed' WHERE id = ${id}`);
    const [result] = await db.query(
      'UPDATE tasks SET status = ? WHERE id = ?',
      ['completed', Number(id)]
    );
    
    if (result.affectedRows === 0) {
      console.log(`No rows affected when completing task ${id}`);
      return res.status(500).json({ error: 'Failed to complete task' });
    }
    
    console.log(`Successfully marked task ${id} as complete`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error completing task:', err);
    res.status(500).json({ error: 'Failed to update task status: ' + err.message });
  }
});

// Update self-assigned task status
router.patch('/self-tasks/:id/status', auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log(`Attempting to update task ${id} status to ${status} for user ${req.user.id}`);
  
  // Validate status
  const validStatuses = ['pending', 'in_progress', 'completed'];
  if (!status || !validStatuses.includes(status)) {
    console.log(`Invalid status value: ${status}`);
    return res.status(400).json({ error: 'Invalid status value' });
  }
  
  try {
    console.log(`User ID from auth: ${req.user.id} (${typeof req.user.id})`);
    
    // First check if the task exists and is assigned to this user
    const [tasks] = await db.query(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );
    
    console.log(`Task query result:`, tasks.length > 0 ? JSON.stringify(tasks[0]) : 'No task found');
    
    if (tasks.length === 0) {
      console.log(`Task ${id} not found`);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = tasks[0];
    
    // Check if the task is assigned to the current user
    // Convert both to numbers for comparison to avoid type mismatch
    if (Number(task.assigned_to) !== Number(req.user.id)) {
      console.log(`Task ${id} is assigned to user ${task.assigned_to} (${typeof task.assigned_to}), not to the current user ${req.user.id} (${typeof req.user.id})`);
      return res.status(403).json({ error: 'You can only update tasks assigned to you' });
    }
    
    // Update the task status
    console.log(`Executing UPDATE query: UPDATE tasks SET status = '${status}' WHERE id = ${id}`);
    const [result] = await db.query(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, Number(id)]
    );
    
    if (result.affectedRows === 0) {
      console.log(`No rows affected when updating task ${id}`);
      return res.status(500).json({ error: 'Failed to update task status' });
    }
    
    console.log(`Successfully updated task ${id} status to ${status}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({ error: 'Failed to update task status: ' + err.message });
  }
});

// Upload profile photo
router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the filename
    const filename = path.basename(req.file.path);
    const facultyId = req.user.id;
    
    // Get the current photo to delete it if it exists
    const [currentPhoto] = await db.execute(
      'SELECT photo FROM faculty WHERE id = ?',
      [facultyId]
    );
    
    // Delete the old photo file if it exists
    if (currentPhoto.length > 0 && currentPhoto[0].photo) {
      // The photo path is stored as a relative path
      const oldPhotoPath = path.join(__dirname, '../uploads', currentPhoto[0].photo);
      
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }
    
    // Store the relative path to the photo (including faculty ID directory)
    const relativePhotoPath = `faculty/${facultyId}/${filename}`;
    
    // Update the faculty record with the new photo path
    await db.execute(
      'UPDATE faculty SET photo = ? WHERE id = ?',
      [relativePhotoPath, facultyId]
    );

    // Construct the full URL to the uploaded file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const photoUrl = `${baseUrl}/uploads/${relativePhotoPath}`;

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
    const facultyId = req.user.id;
    
    // Get the current photo
    const [currentPhoto] = await db.execute(
      'SELECT photo FROM faculty WHERE id = ?',
      [facultyId]
    );
    
    // If no photo exists, return success
    if (currentPhoto.length === 0 || !currentPhoto[0].photo) {
      return res.json({ 
        success: true, 
        message: 'No profile photo to remove'
      });
    }
    
    // Delete the photo file - the photo path is stored as a relative path
    const photoPath = path.join(__dirname, '../uploads', currentPhoto[0].photo);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
    
    // Update the faculty record to remove the photo reference
    await db.execute(
      'UPDATE faculty SET photo = NULL WHERE id = ?',
      [facultyId]
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

// Direct check endpoint for debugging
router.get('/tickets/check', auth, async (req, res) => {
  try {
    console.log('Direct check endpoint called by faculty ID:', req.user.id);
    
    // Check if tickets table exists
    const [tables] = await db.execute('SHOW TABLES LIKE "tickets"');
    if (tables.length === 0) {
      return res.json({ message: 'Tickets table does not exist' });
    }
    
    // Get all tickets regardless of type
    const [allTickets] = await db.execute(
      'SELECT id, subject, type, status, visible_to, raised_by FROM tickets'
    );
    
    // Get profile update tickets specifically
    const [profileTickets] = await db.execute(
      'SELECT id, subject, type, status, visible_to, raised_by FROM tickets WHERE type = "profile_update"'
    );
    
    // Check if any tickets have visible_to set to include faculty
    const [facultyVisibleTickets] = await db.execute(
      'SELECT id, subject, type, status, visible_to, raised_by FROM tickets WHERE visible_to LIKE "%faculty%"'
    );
    
    res.json({
      allTickets,
      profileTickets,
      facultyVisibleTickets,
      message: 'Direct check completed'
    });
  } catch (error) {
    console.error('Error in direct check endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tickets
router.get('/tickets', auth, async (req, res) => {
  try {
    console.log('Faculty tickets endpoint called by faculty ID:', req.user.id);
    
    // First, check if the tickets table exists
    try {
      // Use a simple query to check if the tickets table exists
      const [result] = await db.execute('SHOW TABLES LIKE "tickets"');
      
      if (result.length === 0) {
        // Tickets table doesn't exist, create it
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
            visible_to VARCHAR(50) DEFAULT 'admin,faculty',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        
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
      
      // Check if approved_by_type column exists
      const [approvedByTypeColumns] = await db.execute('SHOW COLUMNS FROM tickets LIKE "approved_by_type"');
      
      if (approvedByTypeColumns.length === 0) {
        // Add approved_by_type column
        console.log('Adding approved_by_type column to tickets table');
        await db.execute('ALTER TABLE tickets ADD COLUMN approved_by_type VARCHAR(20)');
      }
      
      // Check if completed column exists
      const [completedColumns] = await db.execute('SHOW COLUMNS FROM tickets LIKE "completed"');
      
      if (completedColumns.length === 0) {
        // Add completed column
        console.log('Adding completed column to tickets table');
        await db.execute('ALTER TABLE tickets ADD COLUMN completed BOOLEAN DEFAULT FALSE');
      }
      
      // Check if visible_to column exists
      const [visibleToColumns] = await db.execute('SHOW COLUMNS FROM tickets LIKE "visible_to"');
      
      if (visibleToColumns.length === 0) {
        // Add visible_to column
        await db.execute('ALTER TABLE tickets ADD COLUMN visible_to VARCHAR(50) DEFAULT "admin"');
        
        // Update existing profile_update tickets to be visible to faculty
        await db.execute(
          'UPDATE tickets SET visible_to = "admin,faculty" WHERE type = "profile_update"'
        );
      }
      
      // Update all existing profile_update tickets to be visible to faculty
      console.log('Updating all profile_update tickets to be visible to faculty...');
      await db.execute(
        'UPDATE tickets SET visible_to = "admin,faculty" WHERE type = "profile_update"'
      );
      
      // Log the update result
      const [updatedTickets] = await db.execute(
        'SELECT COUNT(*) as count FROM tickets WHERE type = "profile_update" AND visible_to = "admin,faculty"'
      );
      console.log(`Updated ${updatedTickets[0].count} profile_update tickets to be visible to faculty`);
      
      // First, check all tickets to debug
      const [allTickets] = await db.execute(
        'SELECT id, subject, type, status, visible_to, raised_by FROM tickets'
      );
      
      console.log('All tickets in the system:', JSON.stringify(allTickets, null, 2));
      
      // Direct check for profile update tickets
      const [profileTickets] = await db.execute(
        'SELECT COUNT(*) as count FROM tickets WHERE type = "profile_update"'
      );
      console.log(`Direct check: Found ${profileTickets[0].count} profile update tickets in database`);
      
      // Get all profile update tickets for faculty - try a different approach
      console.log('Executing query to get profile update tickets...');
      
      // First, get all tickets regardless of type to see what's in the database
      const [allTypeTickets] = await db.execute(
        'SELECT id, subject, type FROM tickets'
      );
      console.log('All ticket types in database:', allTypeTickets.map(t => `${t.id}: ${t.type}`));
      
      // Now get profile update tickets specifically
      const [tickets] = await db.execute(
        'SELECT t.*, s.name as student_name, s.name as raised_by_name ' +
        'FROM tickets t ' +
        'LEFT JOIN students s ON t.raised_by = s.id ' +
        'WHERE t.type = "profile_update"'
      );
      
      // If we have tickets, check if the student exists
      if (tickets.length > 0) {
        for (const ticket of tickets) {
          if (ticket.raised_by) {
            const [students] = await db.execute(
              'SELECT id, name FROM students WHERE id = ?',
              [ticket.raised_by]
            );
            console.log(`Student check for ticket ${ticket.id}: ${students.length > 0 ? 'Found student: ' + students[0].name : 'Student not found'}`);
          }
        }
      }
      
      console.log(`Query returned ${tickets.length} profile update tickets`);
      
      // Log each ticket for debugging
      tickets.forEach((ticket, index) => {
        console.log(`Ticket ${index + 1}:`, {
          id: ticket.id,
          subject: ticket.subject,
          type: ticket.type,
          status: ticket.status,
          raised_by: ticket.raised_by,
          visible_to: ticket.visible_to
        });
      });
      
      console.log(`Found ${tickets.length} profile update tickets for faculty`);
      
      console.log(`Found ${tickets.length} profile update tickets for faculty`);
      
      res.json(tickets);
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
    const { action, approved_by_type = 'faculty' } = req.body; // 'approve' or 'reject'
    const ticketId = req.params.id;
    const facultyId = req.user.id;

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
        ['approved', 'Profile update approved by faculty', facultyId, approved_by_type, false, ticketId]
      );
    } else if (action === 'reject') {
      // Update ticket status to closed and reset profile_edit
      await db.execute(
        'UPDATE tickets SET status = ?, response = ?, approved_by = ?, approved_by_type = ? WHERE id = ?',
        ['closed', 'Profile update rejected by faculty', facultyId, approved_by_type, ticketId]
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

module.exports = router;