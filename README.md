# 🚀 URL Shortener (Shortify)

A complete full-stack URL shortening service built with **Go** (Golang) and **React**.
This project allows you to transform long URLs into short links, customize aliases, generate QR codes, and track detailed analytics.

---

## ✨ Features

### 🔗 Core Features
| Feature | Description |
| :--- | :--- |
| **Link Shortening** | Automatic generation of short codes (e.g. `/aBz12`) or creation of **custom aliases** (e.g. `/my-project`). |
| **QR Codes** | Instant QR code generation for every shortened link. |
| **Expiration** | Ability to set an expiration date/time. The link becomes invalid (Page 410 Gone) once expired. |
| **Redirection** | Fast and reliable redirection to the original URL. |

### 📊 Analytics & Dashboard
* **User Dashboard**: Full link management (List, Edit, Delete).
* **Detailed Statistics**:
    * Total number of clicks.
    * Unique visitors.
    * 📈 Clicks per day chart (last 30 days).
    * 🌍 Click details: Date, IP address, City, and Country (Geolocation).

### 🛡️ Security & Technical
* **Authentication**: Secure signup and login (passwords hashed with bcrypt, sessions via HttpOnly cookies).
* **Rate Limiting**: Anti-spam protection (IP-based request limits using middleware).
* **Database**: Persistent storage with **SQLite**.

---

## 🛠️ Tech Stack

### Backend
* **Language**: Go (Golang)
* **Database**: SQLite3
* **Authentication**: Sessions & Cookies
* **Main Dependencies**:
    * `github.com/mattn/go-sqlite3` (SQL driver)
    * `golang.org/x/crypto` (Password hashing)
    * `github.com/skip2/go-qrcode` (QR code generation)

### Frontend
* **Framework**: React (v19)
* **Build Tool**: Vite
* **Routing**: React Router DOM
* **Style**: Modular CSS

---

## 🚀 Installation & Running

**Prerequisites**: Make sure **Go** and **Node.js** are installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/Pazirs/url-shortener.git
cd url-shortener
```

### 2. Run the Backend (API Server)
The backend handles the business logic, database, and serves the API on port `8080`.

Open a terminal at the project root:
```bash
# Install Go dependencies
go mod tidy

# Start the server
go run main.go
```
> ✅ The server will start on `http://localhost:8080`.
> A `urls.db` database will be automatically created at the root.

### 3. Run the Frontend (React UI)
The frontend is the user interface. It runs on port `5173` (by default) and communicates with the backend.

Open a **second terminal**:
```bash
cd url-shortener-frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```
> ✅ Click the displayed link (e.g., `http://localhost:5173`) to open the app in your browser.

---

## 📖 Usage Guide

1.  **Sign Up**: Create an account using the "Create account" form.
2.  **Login**: Log in to access your Dashboard.
3.  **Shorten**:
    * Paste a long URL.
    * (Optional) Choose a custom **Alias**.
    * (Optional) Set an **Expiration Date**.
    * Click "Shorten".
4.  **Manage**:
    * Copy the short link.
    * Click **QR Code** to view/download it.
    * Click **Stats** to see who clicked your link.

---

## 📂 Project Structure

```bash
url-shortener/
├── main.go                 # Backend entry point (Server, CORS, Rate Limit)
├── go.mod                  # Go dependencies
├── urls.db                 # SQLite database (generated on startup)
│
├── internal/
│   ├── api/                # API logic (Handlers, Routes, Middleware, Auth)
│   └── db/                 # Database connection and table creation
│
└── url-shortener-frontend/ # React Frontend folder
    ├── src/
    │   ├── App.jsx         # Main component (Routing)
    │   ├── Dashboard.jsx   # Dashboard (Main UI logic)
    │   └── ...             # Other components (Login, Register, Header)
    └── package.json        # JS dependencies
```

---
