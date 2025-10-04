// update_db_schema.js
// This script is used once to add the missing 'approverId' column 
// to the 'expenses' table in the 'expenses.db' file.
// Usage: node update_db_schema.js

const Database = require('better-sqlite3');

console.log('--- Database Schema Update ---');

try {
    // Connect to the existing database file
    const db = new Database('expenses.db'); 
    
    // Check if the column already exists (a safe check)
    const info = db.prepare("PRAGMA table_info(expenses)").all();
    const columnExists = info.some(column => column.name === 'approverId');
    
    if (columnExists) {
        console.log("✅ 'approverId' column already exists. No action needed.");
    } else {
        // SQL command to add the missing column to the table. 
        // We set a default of NULL as existing claims have not been approved yet.
        const alterTableSql = `
            ALTER TABLE expenses ADD COLUMN approverId INTEGER DEFAULT NULL;
        `;
        
        db.exec(alterTableSql);
        console.log("🎉 Successfully added 'approverId' column to the 'expenses' table.");
        console.log("You can now restart your server.js and try the approval action.");
    }

    db.close();
    
} catch (error) {
    console.error('❌ FATAL ERROR during database schema update:', error.message);
    console.error('This often happens if you have not run your initial database creation script (init_db.js) or if the expenses.db file is missing.');
}

console.log('------------------------------');
