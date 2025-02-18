const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
// Define ports for different services
const API_PORT = 3000;      // API and backend services
const WEB_PORT = 80;        // or 443 for HTTPS - main web traffic
const DB_PORT = 3306;       // MySQL

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else if (isProduction && origin === process.env.ALLOWED_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Serve login page for root path and /login
app.get('/', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all route to redirect to login if not authenticated
app.get('*', (req, res, next) => {
  // List of paths that should be accessible without authentication
  const publicPaths = [
    '/login.html',
    '/signup.html',
    '/css/',
    '/js/',
    '/images/',
    '/fonts/',
    '/jqvmap/'
  ];

  // Check if the requested path is public
  if (publicPaths.some(path => req.path.includes(path))) {
    return next();
  }

  // Check authentication for all other routes
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login.html');
  }
  next();
});

// MySQL connection pool
const pool = mysql.createPool({
  host: 'db', // from docker-compose.yml
  user: 'root',
  password: 'password',
  database: 'mydatabase',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}).promise(); // Using promise wrapper for cleaner async/await syntax

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Sign up endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    console.log('Received signup request:', { name, email, phone });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      console.log('Invalid phone format');
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('Email already exists');
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into database
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, email, phone, passwordHash]
    );

    console.log('User created successfully');
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Server error in /api/signup:', error);
    res.status(500).json({ error: 'Error creating user: ' + error.message });
  }
});

// Update cookie settings for production
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  domain: isProduction ? process.env.COOKIE_DOMAIN : 'localhost'
};

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user from database
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token in cookie with environment-specific options
    res.cookie('token', token, cookieOptions);

    res.json({ message: 'Logged in successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Protected route example
app.get('/api/user', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

// Database connection test route (Optional - You can keep or remove)
app.get('/dbtest', (req, res) => {
  pool.query('SELECT NOW() AS now', (error, results) => {
    if (error) {
      res.send(`Database connection failed: ${error.message}`);
    } else {
      res.send(`Database connection successful! Current time: ${results[0].now}`);
    }
  });
});

// Save exercise data for user
app.post('/api/exercises', authenticateToken, async (req, res) => {
  try {
    const { exerciseId, exerciseName, weight, reps } = req.body;
    const userId = req.user.userId;

    // Insert or update max lift
    await pool.execute(`
      INSERT INTO user_exercises (user_id, exercise_id, exercise_name, max_weight, max_reps)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        max_weight = GREATEST(max_weight, ?),
        max_reps = GREATEST(max_reps, ?)
    `, [userId, exerciseId, exerciseName, weight, reps, weight, reps]);

    // Record in history
    await pool.execute(`
      INSERT INTO exercise_history (user_id, exercise_id, weight, reps)
      VALUES (?, ?, ?, ?)
    `, [userId, exerciseId, weight, reps]);

    res.json({ message: 'Exercise data saved successfully' });
  } catch (error) {
    console.error('Error saving exercise:', error);
    res.status(500).json({ error: 'Error saving exercise data' });
  }
});

// Get user's exercise data
app.get('/api/exercises', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all user's exercises with their max lifts
    const [exercises] = await pool.execute(`
      SELECT * FROM user_exercises
      WHERE user_id = ?
      ORDER BY last_updated DESC
    `, [userId]);

    res.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Error fetching exercise data' });
  }
});

// Get exercise history for a specific exercise
app.get('/api/exercises/:exerciseId/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { exerciseId } = req.params;

    const [history] = await pool.execute(`
      SELECT * FROM exercise_history
      WHERE user_id = ? AND exercise_id = ?
      ORDER BY date_recorded DESC
      LIMIT 10
    `, [userId, exerciseId]);

    res.json({ history });
  } catch (error) {
    console.error('Error fetching exercise history:', error);
    res.status(500).json({ error: 'Error fetching exercise history' });
  }
});

// Create tables if they don't exist
pool.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX email_idx (email)
  )
`).then(() => {
  console.log('Database tables initialized');
  // Test database connection
  return pool.execute('SELECT 1');
}).catch(err => {
  console.error('Error initializing database tables:', err);
});

// Start API server
app.listen(API_PORT, () => {
  console.log(`API is running on port ${API_PORT}`);
});

