require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('./db')
// const db = new Database(pool);
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve frontend files
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'healthcare_portal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = new Database(pool);

module.exports = pool;

// Test database connection
pool.getConnection()
    .then(conn => {
        console.log('Database connected successfully');
        conn.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

    app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if email already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const [users] = await pool.execute(
            'SELECT id, name, email, password FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Return user data (excluding password)
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ==========================================
// 4. HEALTH ASSESSMENT ROUTES
// ==========================================

// Create new health assessment
app.post('/api/assessments', async (req, res) => {
    try {
        const {
            userId,
            age,
            gender,
            height,
            weight,
            bloodPressure,
            bloodSugar,
            cholesterol,
            heartRate,
            smoking,
            exercise,
            medicalHistory,
            medications,
            riskLevel,
            riskScore,
            recommendations
        } = req.body;

         console.log("📩 Received assessment data:", req.body);

        // Validation
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Verify user exists
        const [users] = await pool.execute(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Convert recommendations array to JSON string
        const recommendationsJSON = JSON.stringify(recommendations);

        // Insert assessment
        const [result] = await pool.execute(
            `INSERT INTO health_assessments 
            (user_id, age, gender, height, weight, blood_pressure, blood_sugar, 
             cholesterol, heart_rate, smoking, exercise, medical_history, 
             medications, risk_level, risk_score, recommendations) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, age, gender, height, weight, bloodPressure, bloodSugar,
                cholesterol, heartRate, smoking, exercise, medicalHistory,
                medications, riskLevel, riskScore, recommendationsJSON
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Assessment saved successfully',
            assessmentId: result.insertId
        });

    } catch (error) {
        console.error('Assessment creation error:', error);
        res.status(500).json({ error: 'Server error while saving assessment' });
    }
});

// Get all assessments for a user
app.get('/api/assessments/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const [assessments] = await pool.execute(
            `SELECT * FROM health_assessments 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [userId]
        );

        // Parse recommendations JSON for each assessment
        const parsedAssessments = assessments.map(assessment => ({
            ...assessment,
            recommendations: JSON.parse(assessment.recommendations)
        }));

        res.json({
            success: true,
            assessments: parsedAssessments
        });

    } catch (error) {
        console.error('Get assessments error:', error);
        res.status(500).json({ error: 'Server error while fetching assessments' });
    }
});

// Get single assessment by ID
app.get('/api/assessments/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [assessments] = await pool.execute(
            'SELECT * FROM health_assessments WHERE id = ?',
            [id]
        );

        if (assessments.length === 0) {
            return res.status(404).json({ error: 'Assessment not found' });
        }

        const assessment = {
            ...assessments[0],
            recommendations: JSON.parse(assessments[0].recommendations)
        };

        res.json({
            success: true,
            assessment
        });

    } catch (error) {
        console.error('Get assessment error:', error);
        res.status(500).json({ error: 'Server error while fetching assessment' });
    }
});

// Delete assessment
app.delete('/api/assessments/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM health_assessments WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Assessment not found' });
        }

        res.json({
            success: true,
            message: 'Assessment deleted successfully'
        });

    } catch (error) {
        console.error('Delete assessment error:', error);
        res.status(500).json({ error: 'Server error while deleting assessment' });
    }
});

// Get user statistics
app.get('/api/users/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;

        const [stats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_assessments,
                AVG(risk_score) as avg_risk_score,
                MAX(created_at) as last_assessment
             FROM health_assessments 
             WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            stats: stats[0]
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error while fetching statistics' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});