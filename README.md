# Expense_Management_System
Expense Management System (Odoo x Amalthea Hackathon Submission)

-> Project Overview: 
This project is a Simple Expense Manager built as a full-stack application (front-end HTML/JS and a custom Node.js API) designed to handle the two-sided workflow of expense claim management: submission by an Employee and approval by a Manager.The application demonstrates core development principles including API design, data modeling, dynamic UI rendering, and basic user role management.

-> Key Features
The system supports two distinct user roles, allowing for a realistic workflow simulation:
1. Employee Role
Submit New Claim: Employees can submit new expense claims with details like date, description, category, and amount.
View Claims: Employees can view a list of all their submitted claims and track their current Status (Pending, Approved, Rejected).
2. Manager Role
Switch Role: The user can easily switch between the Employee and Manager roles using a button in the top right corner.
Approval Queue: Managers see a dedicated queue of all Pending Approvals across the system.
Actionable Approvals: Managers can instantly Approve or Reject expense claims directly from the queue.

-> Technical Stack
Component Technology Description 
Front-End : Pure HTML5, CSS (minimal), and JavaScriptA simple, responsive single-page interface to interact with the API. No external frameworks were used.
Back-End : APINode.js (Express)Custom RESTful API to handle data operations and business logic (claim submission, status updates, queue management).
Database : SQLite (expenses.db)A local, persistent database used to store all expense claims and their status, ensuring data persistence between server runs.

-> Setup & Execution (For Reviewers)
To run the application locally, you will need Node.js installed.
1. Backend API Setup: The API is located in the api/ directory.Navigate to the API folder:cd api
Install dependencies:npm install
Start the server:node server.js
The server will start on port 3000 and will use the expenses.db file for data persistence.
2. Frontend Application: Locate the Frontend file: The front-end is the file named expense_management.html in the root of the repository.Open in Browser: Once the API server is running (Step 3 above), open the expense_management.html file directly in your web browser (e.g., file:///path/to/repo/expense_management.html).
Test the Roles: The app starts in the Employee role. Use the "Change Role" button to toggle between the Employee and Manager views to test the full feature set.Note on Database Errors: If you encounter a database error on first run (like the no such column: approverId shown in the console), it usually means the database schema needs a quick reset. Simply delete the existing expenses.db file and restart the server. The server is configured to recreate the necessary tables on startup.