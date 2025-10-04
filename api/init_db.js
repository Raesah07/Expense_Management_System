// init_db.js (UPDATED with Users Table)

const Database = require('better-sqlite3');
const db = new Database('expenses.db', { verbose: console.log });

// 1. Create the Users Table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        userId INTEGER PRIMARY KEY,
        employeeName TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL
    );
`);

// 2. Create the Expenses Table (unchanged structure)
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

// 3. Mock User Data to Insert (Initial Users)
const mockUsers = [
    { employeeName: 'Admin User', role: 'Admin' }, // userId 1
    { employeeName: 'Eleanor Vance', role: 'Employee' }, // userId 2
    { employeeName: 'Marcus Holloway', role: 'Employee' }, // userId 3
    { employeeName: 'Jane Smith', role: 'Manager' }, // userId 4
];

const insertUser = db.prepare('INSERT INTO users (employeeName, role) VALUES (?, ?)');

db.transaction((users) => {
    for (const user of users) {
        // Check if user already exists
        const exists = db.prepare('SELECT 1 FROM users WHERE employeeName = ?').get(user.employeeName);
        if (!exists) {
            insertUser.run(user.employeeName, user.role);
        }
    }
})(mockUsers);

// 4. Mock Expense Data (Uses the new User IDs)
const mockExpenses = [
    { userId: 2, employeeName: 'Eleanor Vance', date: '2024-09-25', description: 'Client lunch', category: 'Meals', amount: 45.50, currency: 'USD', status: 'Approved', usdEquivalent: 45.50 },
    { userId: 3, employeeName: 'Marcus Holloway', date: '2024-09-28', description: 'Train ticket to NYC', category: 'Travel', amount: 120.00, currency: 'USD', status: 'Pending', usdEquivalent: 120.00 },
    { userId: 2, employeeName: 'Eleanor Vance', date: '2024-09-30', description: 'New keyboard & mouse', category: 'Office Supplies', amount: 89.99, currency: 'GBP', status: 'Pending', usdEquivalent: 112.49 },
    { userId: 4, employeeName: 'Jane Smith', date: '2024-10-01', description: 'Annual SaaS subscription', category: 'Software', amount: 199.99, currency: 'USD', status: 'Approved', usdEquivalent: 199.99 },
    { userId: 3, employeeName: 'Marcus Holloway', date: '2024-10-03', description: 'Coffee for team celebration', category: 'Meals', amount: 15.00, currency: 'USD', status: 'Rejected', usdEquivalent: 15.00 },
];

// 5. Insert Mock Expense Data (with dynamic docId)
const insertExpense = db.prepare(`
    INSERT INTO expenses (
        userId, employeeName, date, description, category, amount, currency, status, usdEquivalent, docId
    ) VALUES (
        @userId, @employeeName, @date, @description, @category, @amount, @currency, @status, @usdEquivalent, 'e-' || ABS(RANDOM())
    )
`);

db.transaction((expenses) => {
    for (const expense of expenses) {
        insertExpense.run(expense);
    }
})(mockExpenses);


console.log('Database initialized: Users and Expenses tables created/populated.');
db.close();