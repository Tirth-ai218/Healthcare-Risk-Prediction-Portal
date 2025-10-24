// Separate file for database operations
const pool = require('./server');  // path may vary


class Database {
    constructor(pool) {
        this.pool = pool;
    }

    // User operations
    async createUser(name, email, hashedPassword) {
        const [result] = await this.pool.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        return result.insertId;
    }

    async getUserByEmail(email) {
        const [users] = await this.pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return users[0];
    }

    async getUserById(id) {
        const [users] = await this.pool.execute(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [id]
        );
        return users[0];
    }

    // Assessment operations
    async createAssessment(data) {
        const [result] = await this.pool.execute(
            `INSERT INTO health_assessments 
            (user_id, age, gender, height, weight, blood_pressure, blood_sugar, 
             cholesterol, heart_rate, smoking, exercise, medical_history, 
             medications, risk_level, risk_score, recommendations) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.userId, data.age, data.gender, data.height, data.weight,
                data.bloodPressure, data.bloodSugar, data.cholesterol,
                data.heartRate, data.smoking, data.exercise,
                data.medicalHistory, data.medications, data.riskLevel,
                data.riskScore, JSON.stringify(data.recommendations)
            ]
        );
        return result.insertId;
    }

    async getAssessmentsByUser(userId) {
        const [assessments] = await this.pool.execute(
            'SELECT * FROM health_assessments WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return assessments.map(a => ({
            ...a,
            recommendations: JSON.parse(a.recommendations)
        }));
    }

    async deleteAssessment(id) {
        const [result] = await this.pool.execute(
            'DELETE FROM health_assessments WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Database;