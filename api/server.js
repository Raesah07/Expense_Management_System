// server.js (UPDATED for User Management)

const express = require('express');
const cors = require('cors'); 
const Database = require('better-sqlite3');
const app = express();
const PORT = 3000; 

// --- DATABASE CONNECTION ---
const db = new Database('expenses.db'); 
// ---------------------------

const USD_RATE_MOCK = { 'USD': 1.00, 'EUR': 1.08, 'GBP': 1.25 };
const MANAGED_EMPLOYEES = {
    4: [2, 3] // Manager ID 4 manages users 2 and 3 (hardcoded for simplicity)
};

app.use(express.json()); 
app.use(cors());         

// --- NEW USER MANAGEMENT ENDPOINTS ---

// GET /api/users - Get all users (for role selection and management)
app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT userId, employeeName, role FROM users').all();
    res.json(users);
});

// POST /api/users - Create a new user
app.post('/api/users', (req, res) => {
    const { employeeName, role } = req.body;

    if (!employeeName || !role) {
        return res.status(400).json({ message: 'Missing employeeName or role' });
    }

    const stmt = db.prepare('INSERT INTO users (employeeName, role) VALUES (?, ?)');
    try {
        const info = stmt.run(employeeName, role);
        const newUser = db.prepare('SELECT userId, employeeName, role FROM users WHERE userId = ?').get(info.lastInsertRowid);
        res.status(201).json(newUser);
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ message: 'User with this name already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Database error on user creation' });
    }
});

// DELETE /api/users/:userId - Delete a user
app.delete('/api/users/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);

    // 1. Check for open claims (Prevents deleting users with active expenses)
    const hasClaims = db.prepare('SELECT 1 FROM expenses WHERE userId = ?').get(userId);
    if (hasClaims) {
        return res.status(403).json({ message: 'Cannot delete user: They have existing expense claims.' });
    }
    
    // 2. Delete user
    const stmt = db.prepare('DELETE FROM users WHERE userId = ?');
    const result = stmt.run(userId);

    if (result.changes === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', userId });
});

// --- EXPENSE ENDPOINTS (unchanged, but relying on database) ---

// 1. GET /api/expenses/myclaims - Employee View
app.get('/api/expenses/myclaims', (req, res) => {
    const userId = parseInt(req.query.userId); 
    const stmt = db.prepare('SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC');
    const userExpenses = stmt.all(userId);
    res.json(userExpenses);
});

// 2. GET /api/expenses/pending - Manager View
app.get('/api/expenses/pending', (req, res) => {
    const managerId = parseInt(req.query.managerId);
    const teamIds = MANAGED_EMPLOYEES[managerId] || [];

    const placeholders = teamIds.map(() => '?').join(', ');
    if (teamIds.length === 0) {
        return res.json([]);
    }

    const stmt = db.prepare(`
        SELECT * FROM expenses 
        WHERE status = 'Pending' AND userId IN (${placeholders})
        ORDER BY date DESC
    `);
    const pendingApprovals = stmt.all(...teamIds);
    res.json(pendingApprovals);
});

// 3. POST /api/expenses - Submit New Claim
app.post('/api/expenses', (req, res) => {
    const newDocId = 'e-' + Date.now(); 
    const { userId, employeeName, date, description, category, amount, currency } = req.body;

    const usdEquivalent = amount * (USD_RATE_MOCK[currency] || 1);
    const status = 'Pending';

    const stmt = db.prepare(`
        INSERT INTO expenses (docId, userId, employeeName, date, description, category, amount, currency, status, usdEquivalent)
        VALUES (@newDocId, @userId, @employeeName, @date, @description, @category, @amount, @currency, @status, @usdEquivalent)
    `);
    
    try {
        stmt.run({ newDocId, userId, employeeName, date, description, category, amount, currency, status, usdEquivalent });
        const newExpense = db.prepare('SELECT * FROM expenses WHERE docId = ?').get(newDocId);
        res.status(201).json(newExpense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database error on submission' });
    }
});

// 4. PATCH /api/expenses/:docId - Approval Action
app.patch('/api/expenses/:docId', (req, res) => {
    const { docId } = req.params;
    const { status, approverId } = req.body; 

    const stmt = db.prepare('UPDATE expenses SET status = ?, approvedBy = ? WHERE docId = ?');
    const result = stmt.run(status, approverId, docId);

    if (result.changes === 0) {
         return res.status(404).json({ message: 'Expense not found or no changes made' });
    }

    const updatedExpense = db.prepare('SELECT * FROM expenses WHERE docId = ?').get(docId);
    res.json({ message: 'Status updated successfully', expense: updatedExpense });
});


// 5. Start Server
app.listen(PORT, () => {
    console.log(`🚀 USER MANAGEMENT API Server is running on http://localhost:${PORT}`);
});