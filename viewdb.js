import mysql from 'mysql2/promise';

async function viewDatabase() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'Tirth@28',
        database: 'healthcare_portal',
        port: 3000
    });

    try {
        const [users] = await pool.query('SELECT * FROM users');
        console.log("Users:", users);

        const [assessments] = await pool.query('SELECT * FROM health_assessments');
        console.log("Assessments:", assessments);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

viewDatabase();
