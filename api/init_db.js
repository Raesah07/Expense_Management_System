// init_db.js

const Database = require('better-sqlite3');
const db = new Database('expenses.db', { verbose: console.log });

// 1. Create the Expenses Table
db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
        docId TEXT PRIMARY KEY,
        userId INTEGER,
        employeeName TEXT,
        date TEXT,
        description TEXT,
        category TEXT,
        amount REAL,
        currency TEXT,
        status TEXT,
        usdEquivalent REAL
    );
`);

// 2. Mock Data to Insert
// Corrected mock data array in init_db.js

const mockExpenses = [
    { docId: 'e1', userId: 2, employeeName: 'Eleanor Vance', date: '2024-09-25', description: 'Client lunch', category: 'Meals', amount: 45.50, currency: 'USD', status: 'Approved', usdEquivalent: 45.50 },
    { docId: 'e2', userId: 3, employeeName: 'Marcus Holloway', date: '2024-09-28', description: 'Train ticket to NYC', category: 'Travel', amount: 120.00, currency: 'USD', status: 'Pending', usdEquivalent: 120.00 }, // <-- THIS LINE WAS CORRECTED
    { docId: 'e3', userId: 2, employeeName: 'Eleanor Vance', date: '2024-09-30', description: 'New keyboard & mouse', category: 'Office Supplies', amount: 89.99, currency: 'GBP', status: 'Pending', usdEquivalent: 112.49 },
    { docId: 'e4', userId: 4, employeeName: 'Jane Smith', date: '2024-10-01', description: 'Annual SaaS subscription', category: 'Software', amount: 199.99, currency: 'USD', status: 'Approved', usdEquivalent: 199.99 },
    { docId: 'e5', userId: 3, employeeName: 'Marcus Holloway', date: '2024-10-03', description: 'Coffee for team celebration', category: 'Meals', amount: 15.00, currency: 'USD', status: 'Rejected', usdEquivalent: 15.00 },
];

// 3. Insert Mock Data
const insert = db.prepare(`
    INSERT INTO expenses VALUES (
        @docId, @userId, @employeeName, @date, @description, @category, @amount, @currency, @status, @usdEquivalent
    )
`);

db.transaction((expenses) => {
    for (const expense of expenses) {
        // Check if expense already exists (for clean restarts)
        const exists = db.prepare('SELECT 1 FROM expenses WHERE docId = ?').get(expense.docId);
        if (!exists) {
            insert.run(expense);
        }
    }
})(mockExpenses);

console.log('Database initialized and expenses table created/populated.');
db.close();