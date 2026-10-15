# Personal Notes App

A full-stack Personal Notes web application built with **React 19**, **Node.js**, **Express.js**, and **MongoDB Atlas with Mongoose**. Features JWT-based authentication, bcrypt password hashing, note pinning, tag filtering, real-time client-side search, strict multi-tenant data isolation, and a clean, production-grade light theme.

---

## Live Deployments & Links

| Service | Platform | URL |
|---|---|---|
| **Backend API** | Render | [https://personal-notes-8mgo.onrender.com/](https://personal-notes-8mgo.onrender.com/) |
| **Frontend App** | Vercel | Production deployment on Vercel |
| **Database** | MongoDB Atlas | Cloud MongoDB M0 Cluster (`notes_db`) |
| **Repository** | GitHub | [https://github.com/laddasiddharth/Personal-Notes](https://github.com/laddasiddharth/Personal-Notes) |

---

## Core Features

- **Authentication & Security:**
  - Secure registration and login with strict input validation.
  - Passwords hashed using `bcryptjs` with 10 salt rounds (never stored in plain text).
  - Stateless authentication using JSON Web Tokens (JWT) with 7-day expiration.
  - Multi-tenant data isolation: users can strictly view, edit, and delete only their own notes.

- **Note Management (CRUD):**
  - Create, read, update, and delete notes.
  - One-click pin/unpin functionality; pinned notes are dynamically prioritized at the top.
  - Comma-separated tag organization with automatic whitespace trimming and deduplication.
  - Real-time client-side search filtering across both note titles and tags.
  - Human-readable creation date formatting.

- **User Interface & Experience:**
  - Modern, responsive light theme with crisp slate typography and subtle borders.
  - Controlled forms with character count caps (title <= 200, content <= 20,000).
  - Instant optimistic-style sorting: new notes appear at the top of their respective section.
  - Loading spinners, empty states with contextual guidance, and safe error handling.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Vanilla CSS3 (Custom Design System, CSS Grid & Flexbox) |
| **Backend** | Node.js (v24), Express.js |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Testing & Linting** | Custom integration test suite (`test_api.js`), oxlint |
| **Infrastructure** | Vercel (Frontend), Render (Backend), cron-job.org (Keep-Alive Ping) |

---

## System Architecture

```text
Personal-Notes/
├── backend/
│   ├── middleware/
│   │   └── auth.js            # JWT verification & req.user injection
│   ├── models/
│   │   ├── Note.js            # Note schema, userId foreign key & compound index
│   │   └── User.js            # User schema, RFC email regex & bcrypt hash
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth (register, login, me)
│   │   └── noteRoutes.js      # /api/notes (protected CRUD endpoints)
│   ├── .env.example           # Environment template (PORT, MONGO_URI, JWT_SECRET)
│   ├── package.json           # Backend dependencies, scripts & npm test
│   ├── server.js              # Express entry point, CORS, 404 & error handlers
│   └── test_api.js            # Automated 26-assertion integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthForm.jsx   # Tabbed Sign In / Register card with validation
│   │   │   ├── NoteCard.jsx   # Individual note card, pin toggle, delete prompt
│   │   │   └── NoteForm.jsx   # Controlled Create/Edit form with tag deduplication
│   │   ├── App.jsx            # State coordinator, search filter & API client
│   │   ├── App.css            # Component styles & responsive grid layout
│   │   ├── index.css          # Design system tokens, variables & typography
│   │   └── main.jsx           # React DOM root entry point
│   ├── index.html             # Host HTML document
│   ├── package.json           # Frontend dependencies, Vite & oxlint scripts
│   ├── vercel.json            # Vercel SPA rewrite routing rules
│   └── vite.config.js         # Vite bundler configuration
└── README.md                  # Project overview & documentation (this file)
```

---

## Database Schemas

### 1. User Schema (`backend/models/User.js`)
```javascript
{
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true, 
    maxlength: 254,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: { type: String, required: true, minlength: 6 }, // Stored as Bcrypt hash
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Note Schema (`backend/models/Note.js`)
```javascript
{
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 20000 },
  tags: { type: [String], default: [] },
  pinned: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: Date,
  updatedAt: Date
}

// Compound index for optimal dashboard query performance:
noteSchema.index({ userId: 1, pinned: -1, createdAt: -1 });
```

---

## REST API Reference

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Request Body | Headers | Status |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user & issue JWT | `{ "name": "...", "email": "...", "password": "..." }` | `Content-Type: application/json` | `201`, `400` |
| `POST` | `/api/auth/login` | Validate credentials & issue JWT | `{ "email": "...", "password": "..." }` | `Content-Type: application/json` | `200`, `400` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | None | `Authorization: Bearer <token>` | `200`, `401`, `404` |

### Notes Endpoints (`/api/notes`) *(All Require `Authorization: Bearer <token>`)*

| Method | Endpoint | Description | Request Body | Status |
|---|---|---|---|---|
| `GET` | `/api/notes` | Fetch notes belonging strictly to the user | None | `200`, `401` |
| `POST` | `/api/notes` | Create a note (`userId` derived from token) | `{ "title": "...", "content": "...", "tags": [], "pinned": false }` | `201`, `400`, `401` |
| `PUT` | `/api/notes/:id` | Update note (enforces ownership check) | `{ "title": "...", "content": "...", "tags": [], "pinned": false }` | `200`, `400`, `401`, `403`, `404` |
| `DELETE` | `/api/notes/:id` | Delete note (enforces ownership check) | None | `200`, `400`, `401`, `403`, `404` |

---

## Automated Testing

The backend includes a 26-assertion integration test suite verifying health checks, RFC email validation, Bcrypt password matching, MongoDB duplicate key race condition handling, note CRUD operations, and tag deduplication.

```bash
cd backend

# Run tests against local server (http://localhost:5000)
npm test

# Run tests against live deployed server
node test_api.js https://personal-notes-8mgo.onrender.com
```

---

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB Atlas account or local MongoDB instance

### 1. Clone the repository
```bash
git clone https://github.com/laddasiddharth/Personal-Notes.git
cd Personal-Notes
```

### 2. Configure and run Backend
```bash
cd backend
npm install
cp .env.example .env
```

Configure `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/notes_db?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_jwt_secret_key
```

Start the backend:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

### 3. Configure and run Frontend
In a second terminal window:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Production Deployment & Infrastructure

### 1. Database (MongoDB Atlas)
1. Create a free **M0 Shared Cluster** on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Security ➔ Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) to permit cloud connections.
3. Under **Security ➔ Database Access**, create a user with read/write permissions.
4. Copy the connection string into the backend environment variables.

### 2. Backend (Render)
1. Create a **New Web Service** on [Render](https://dashboard.render.com/) and connect this repository.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
3. Environment Variables:
   - `MONGO_URI`: *Your MongoDB Atlas connection URI*
   - `JWT_SECRET`: *A secure random secret string*

### 3. Frontend (Vercel)
1. Import the repository on [Vercel](https://vercel.com/).
2. Select **`frontend`** as the Root Directory (Framework Preset: `Vite`).
3. Add Environment Variable:
   - `VITE_API_URL`: Your live Render backend URL **without trailing slash** (e.g., `https://personal-notes-8mgo.onrender.com`).
4. Deploy. Vercel utilizes `frontend/vercel.json` for SPA route rewrites.

### 4. Zero-Downtime Keep-Alive (cron-job.org)
Render's free tier spins down after 15 minutes of inactivity. To eliminate cold starts:
1. Register a free monitor on [cron-job.org](https://cron-job.org/).
2. Set the target URL to `https://personal-notes-8mgo.onrender.com/`.
3. Set the schedule to **Every 10 minutes** using HTTP `GET`.


---

## License

This project is licensed under the ISC License.
