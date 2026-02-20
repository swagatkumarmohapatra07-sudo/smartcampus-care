const express = require('express');
const path = require('path');
const db = require('./db'); 

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Admin Login
app.post('/api/admin-login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ? AND password = ? AND role = "Admin"', [username, password]);
        if (users.length > 0) res.json({ success: true, user: users[0] });
        else res.json({ success: false, message: 'Invalid Admin credentials' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Student Registration
app.post('/api/register', async (req, res) => {
    const { full_name, course, branch, section, registration_number, password } = req.body;
    try {
        await db.query(
            'INSERT INTO users (role, full_name, course, branch, section, registration_number, password) VALUES ("Student", ?, ?, ?, ?, ?, ?)', 
            [full_name, course, branch, section, registration_number, password]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Student Login
app.post('/api/student-login', async (req, res) => {
    const { registration_number, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE registration_number = ? AND password = ? AND role = "Student"', [registration_number, password]);
        if (users.length > 0) res.json({ success: true, user: users[0] });
        else res.json({ success: false, message: 'Invalid Student credentials' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Submit Complaint
app.post('/api/complaints', async (req, res) => {
    const { student_id, description } = req.body;
    try {
        await db.query('INSERT INTO complaints (student_id, description) VALUES (?, ?)', [student_id, description]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Get Complaints (For both Admin and Student)
app.get('/api/complaints', async (req, res) => {
    const { role, userId } = req.query;
    try {
        if (role === 'Student') {
            // Student only sees their own
            const [complaints] = await db.query('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [userId]);
            res.json(complaints);
        } else {
            // Admin sees all, joined with student details
            const [complaints] = await db.query(`
                SELECT c.*, u.full_name, u.course, u.branch, u.section, u.registration_number 
                FROM complaints c 
                JOIN users u ON c.student_id = u.id 
                ORDER BY c.created_at DESC
            `);
            res.json(complaints);
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Admin Update Status
app.put('/api/complaints/:id', async (req, res) => {
    try {
        await db.query('UPDATE complaints SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. Analytics
app.get('/api/analytics', async (req, res) => {
    try {
        const [[total]] = await db.query('SELECT COUNT(*) as count FROM complaints');
        const [[resolved]] = await db.query('SELECT COUNT(*) as count FROM complaints WHERE status = "Resolved"');
        res.json({ total: total.count, resolved: resolved.count });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));