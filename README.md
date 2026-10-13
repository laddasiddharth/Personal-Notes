# 📝 Personal Notes App (MERN Stack)

A secure, responsive, full-stack Personal Notes web application built with **React**, **Node.js**, **Express.js**, and **MongoDB with Mongoose**. Features JWT-based authentication, bcrypt password hashing, note pinning, tag filtering, real-time search, and strict multi-user data isolation.

---

## ✨ Features

- 🔐 **User Authentication & Security:**
  - Secure registration and login with input validation.
  - Passwords hashed with `bcryptjs` (never stored in plain text).
  - Stateless authentication using **JSON Web Tokens (JWT)**.
- 📝 **Full Note Management (CRUD):**
  - Create, read, update, and delete notes.
  - Real-time character counts, formatted dates, and markdown-friendly note content.
- 📌 **Pin to Top:**
  - One-click pin/unpin functionality; pinned notes automatically appear at the top.
- 🏷️ **Tagging & Filtering:**
  - Add comma-separated tags to organize notes into categories.
- 🔍 **Instant Search:**
  - Real-time client-side search by note title and tags.
- 🛡️ **Strict Data Isolation (Multi-Tenant):**
  - Notes are strictly linked to the authenticated user's ID derived from their JWT.
  - A user cannot view, edit, or delete notes belonging to another user.
- 📱 **Modern & Responsive UI:**
  - Built with React, Vite, and custom CSS design system.
  - Smooth micro-interactions, dark aesthetic, loading spinners, and empty states.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Vanilla CSS3 (Custom Design System, Flexbox/Grid) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication & Security** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv` |

---

## 🏗️ Architecture & Project Structure

```text
Personal-Notes/
├── backend/
│   ├── middleware/
│   │   └── auth.js            # JWT verification & req.user extraction
│   ├── models/
│   │   ├── Note.js            # Mongoose Note schema (userId, title, content, tags, pinned)
│   │   └── User.js            # Mongoose User schema (name, email, password hash)
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth (register, login, me)
│   │   └── noteRoutes.js      # /api/notes (protected CRUD endpoints)
│   ├── .env.example           # Environment template (PORT, MONGO_URI, JWT_SECRET)
│   ├── .gitignore             # Excludes node_modules and .env
│   ├── package.json           # Backend dependencies and scripts
│   └── server.js              # Express app initialization & MongoDB connection
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthForm.jsx   # Sign In & Registration tabbed card
│   │   │   ├── NoteCard.jsx   # Individual note card with pin, edit, delete
│   │   │   └── NoteForm.jsx   # Create/Edit note form with validation
│   │   ├── App.jsx            # Main app container, state management, search
│   │   ├── App.css            # Component styles & responsive layout
│   │   ├── index.css          # Design tokens & base variables
│   │   └── main.jsx           # React DOM root entry
│   ├── .env.example           # Frontend environment template (VITE_API_URL)
│   ├── .gitignore             # Excludes node_modules and dist
│   └── package.json           # Frontend dependencies and Vite build scripts
├── .gitignore                 # Root gitignore protecting all secrets & artifacts
└── README.md                  # Complete documentation & deployment guide
```

---

## 🗄️ Database Schemas

### 1. User Schema (`backend/models/User.js`)
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // Stored as bcrypt hash
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Note Schema (`backend/models/Note.js`)
```javascript
{
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  pinned: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📡 REST API Reference

### 🔐 Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Request Body | Headers |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user & issue JWT | `{ "name": "...", "email": "...", "password": "..." }` | `Content-Type: application/json` |
| `POST` | `/api/auth/login` | Validate credentials & issue JWT | `{ "email": "...", "password": "..." }` | `Content-Type: application/json` |
| `GET` | `/api/auth/me` | Get current user profile | None | `Authorization: Bearer <token>` |

### 📝 Notes Endpoints (`/api/notes`) *(All Require `Authorization: Bearer <token>`)*

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `GET` | `/api/notes` | Fetch notes belonging to authenticated user | None |
| `POST` | `/api/notes` | Create a note (userId derived from token) | `{ "title": "...", "content": "...", "tags": [], "pinned": false }` |
| `PUT` | `/api/notes/:id` | Update note (enforces owner check) | `{ "title": "...", "content": "...", "tags": [], "pinned": false }` |
| `DELETE` | `/api/notes/:id` | Delete note (enforces owner check) | None |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/notes_db
JWT_SECRET=your_super_secret_jwt_key_here
```

### Frontend (`frontend/.env` - optional in development)
```env
VITE_API_URL=http://localhost:5000
```

> ⚠️ **Security Notice:** `.env` files contain sensitive secrets and are excluded by `.gitignore`. Never commit them to version control.

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/laddasiddharth/Personal-Notes.git
cd Personal-Notes
```

### 2. Configure & Run Backend
```bash
cd backend
npm install
cp .env.example .env
# Start the backend server (runs on http://localhost:5000)
npm run dev
```

### 3. Configure & Run Frontend
In a second terminal window:
```bash
cd frontend
npm install
# Start the frontend dev server (runs on http://localhost:5173)
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🌐 Production Deployment Guide

### Step 1: Set Up MongoDB Atlas (Cloud Database)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Shared Cluster**.
3. Under **Security ➔ Database Access**, create a user (e.g. `notes_admin`) with a secure password.
4. Under **Security ➔ Network Access**, click **Add IP Address** and select **Allow Access from Anywhere (`0.0.0.0/0`)** so cloud servers can connect.
5. In your cluster dashboard, click **Connect ➔ Drivers (Node.js)** and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/notes_db?retryWrites=true&w=majority
   ```

### Step 2: Deploy Backend (Render / Railway)
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New + ➔ Web Service**.
3. Connect your GitHub repository (`Personal-Notes`).
4. Configure service settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. In the **Environment Variables** section, add:
   - `PORT`: `5000`
   - `MONGO_URI`: *Your MongoDB Atlas connection string from Step 1*
   - `JWT_SECRET`: *A secure random secret key*
6. Click **Deploy**. Note your live backend URL (e.g., `https://personal-notes-api.onrender.com`).

### Step 3: Deploy Frontend (Vercel / Netlify)
1. Sign in to [Vercel](https://vercel.com) and click **Add New ➔ Project**.
2. Import your GitHub repository (`Personal-Notes`).
3. Set **Root Directory** to `frontend`.
4. In the **Environment Variables** section, add:
   - `VITE_API_URL`: `https://personal-notes-api.onrender.com` *(your live backend URL without trailing slash)*
5. Click **Deploy**. Your frontend is now live!

---

## 📅 Development Roadmap

- [x] **Day 1:** Project scaffolding, Express server, MongoDB connection, Note Mongoose model.
- [x] **Day 2:** REST API endpoints (`GET`, `POST`, `PUT`, `DELETE`) with validation and error handling.
- [x] **Day 3:** React frontend dashboard, note cards, dynamic form, loading states, and full API integration.
- [x] **Day 4:** User authentication (JWT + bcrypt), note ownership security, search by title, tags, and pinning.
- [x] **Day 5:** Security audit, edge-case testing, production deployment configuration, and portfolio documentation.
