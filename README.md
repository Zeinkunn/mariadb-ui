# MariaDB Web UI

A modern, lightweight, and fully functional Web UI for managing MariaDB databases, built directly over your `localhost` server. It aims to replicate the core functionalities of the MariaDB CLI within a clean, gimmick-free interface.

## Features

- **Connection Manager**: Connect seamlessly to your local or remote MariaDB instances. Configuration is persisted locally.
- **SQL Query Editor**: Powered by CodeMirror 6, featuring syntax highlighting, query history, and execution shortcuts (`Ctrl+Enter`).
- **Data Browser**: A powerful data grid to view, sort, and filter table records. Includes inline cell editing, bulk row deletion, and record insertion forms.
- **Schema Management**: View and modify table structures (add, alter, or drop columns). Easily toggle nullability, auto-increment, and default values. View indexes and raw `SHOW CREATE TABLE` statements.
- **User & Privileges Management**: Manage database users (`mysql.user`), reset passwords, and assign or revoke privileges (`GRANT`/`REVOKE`).
- **Server Telemetry**: Real-time server status metrics, global variable management, and a live Process List with the ability to kill specific processes.
- **Import & Export**: Effortlessly export database schemas and data as SQL dump files, or import `.sql` files directly from the UI.
- **Modern UI**: Clean design using TailwindCSS v4 with full support for Dark and Light modes.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Zustand (State Management), TailwindCSS v4
- **Editor:** CodeMirror 6 (`@codemirror/lang-sql`)
- **Backend:** Node.js, Express, `mariadb` (Official Node.js driver)

## Prerequisites

- Node.js (v18 or newer recommended)
- A running MariaDB server (v10.4+ recommended)

## Getting Started

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/mariadb-ui.git
cd mariadb-ui
\`\`\`

### 2. Setup the Backend
The backend requires the `mariadb` driver and Express to connect to your database.
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`
The backend server will start on `http://localhost:3001`.

### 3. Setup the Frontend
Open a new terminal window and navigate to the frontend directory.
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
The frontend development server will start on `http://localhost:5173`.

### 4. Connect
Open `http://localhost:5173` in your browser. Enter your MariaDB credentials (host, port, username, password) to connect and start managing your databases!

## Screenshots

*(Add screenshots of your UI here - e.g., Dashboard, Query Editor, Data Grid, Schema Builder, Server Status)*

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
