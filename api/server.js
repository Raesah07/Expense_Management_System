// server.js (UPDATED FOR SQLITE)

const express = require('express');
const cors = require('cors'); 
const Database = require('better-sqlite3');
const app = express();
const PORT = 3000; 

// --- DATABASE CONNECTION ---
const db = new Database('expenses.db'); 
// You should have run init_db.js before starting the server!
// ---------------------------

const USD_RATE_MOCK = { 'USD': 1.00, 'EUR': 1.08, 'GBP': 1.25 };
const MANAGED_EMPLOYEES = {
    // Manager 4 manages employees 2 and 3
    4: [2, 3] 
};

app.use(express.json()); 
app.use(cors());         

// 1. GET /api/expenses/myclaims - Employee View
app.get('/api/expenses/myclaims', (req, res) => {
    const userId = parseInt(req.query.userId); 
    try {
        const stmt = db.prepare('SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC');
        const userExpenses = stmt.all(userId);
        res.json(userExpenses);
    } catch (error) {
        console.error('Error fetching employee claims:', error);
        res.status(500).json({ message: 'Error fetching employee claims' });
    }
});

// 2. GET /api/expenses/pending - Manager View
app.get('/api/expenses/pending', (req, res) => {
    const managerId = parseInt(req.query.managerId);
    const teamIds = MANAGED_EMPLOYEES[managerId] || [];

    // SQL query to fetch pending expenses for the manager's team
    const placeholders = teamIds.map(() => '?').join(', ');
    if (teamIds.length === 0) {
        return res.json([]);
    }

    try {
        const stmt = db.prepare(`
            SELECT * FROM expenses 
            WHERE status = 'Pending' AND userId IN (${placeholders})
            ORDER BY date DESC
        `);
        // The spread operator correctly passes teamIds as parameters to the query
        const pendingApprovals = stmt.all(...teamIds); 
        res.json(pendingApprovals);
    } catch (error) {
        console.error('Error fetching pending claims:', error);
        res.status(500).json({ message: 'Error fetching pending claims' });
    }
});

// 3. POST /api/expenses - Submit New Claim
app.post('/api/expenses', (req, res) => {
    // Generate a unique ID (using 'e-' prefix for clarity)
    const newDocId = 'e-' + Date.now(); 
    const { userId, employeeName, date, description, category, amount, currency } = req.body;

    const usdEquivalent = amount * (USD_RATE_MOCK[currency] || 1);
    const status = 'Pending';
    
    // NOTE: Explicitly listing column names makes the INSERT statement safer 
    // especially since we are not providing a value for the 'approverId' column yet.
    const stmt = db.prepare(`
        INSERT INTO expenses 
        (docId, userId, employeeName, date, description, category, amount, currency, status, usdEquivalent)
        VALUES (
            @docId, @userId, @employeeName, @date, @description, @category, @amount, @currency, @status, @usdEquivalent
        )
    `);

    try {
        stmt.run({ docId: newDocId, userId, employeeName, date, description, category, amount, currency, status, usdEquivalent });
        const newExpense = db.prepare('SELECT * FROM expenses WHERE docId = ?').get(newDocId);
        res.status(201).json(newExpense);
    } catch (error) {
        // This will log the specific SQL error that caused the 500
        console.error('Database error on submission:', error); 
        res.status(500).json({ message: 'Database error on submission' });
    }
});

// 4. PATCH /api/expenses/:docId - Approval Action
app.patch('/api/expenses/:docId', (req, res) => {
    const { docId } = req.params;
    const { status, approverId } = req.body; 

    try {
        // FIX: Changed 'approvedId' to 'approverId' for consistency with req.body and likely schema
        const stmt = db.prepare('UPDATE expenses SET status = ?, approverId = ? WHERE docId = ?');
        const result = stmt.run(status, approverId, docId);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Expense not found or no changes made' });
        }

        const updatedExpense = db.prepare('SELECT * FROM expenses WHERE docId = ?').get(docId);
        res.json({ message: 'Status updated successfully', expense: updatedExpense });
    } catch (error) {
        // CRITICAL FIX: Explicitly catch and handle the error, preventing server crash (500)
        console.error('Database error on approval action:', error); 
        res.status(500).json({ message: `Approval operation failed: ${error.message}` });
    }
});

// 5. Start Server
app.listen(PORT, () => {
    console.log(`🚀 SQLITE API Server is running on http://localhost:${PORT}`);
    console.log(`Your data is now persistent in expenses.db!`);
});
