# 📑 Personal Notes App — Project Files Report & Code Guide

> **Project:** Full-Stack Personal Notes Web Application (MERN)  
> **Repository:** `laddasiddharth/Personal-Notes`  
> **Stack:** React 19, Vite, Node.js, Express.js, MongoDB Atlas (Mongoose), JWT, Bcrypt.js  
> **Author:** Siddharth Ladda  

---

## 📌 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Backend Architecture & Important Files](#2-backend-architecture--important-files)
   - [server.js](#backendserverjs)
   - [middleware/auth.js](#backendmiddlewareauthjs)
   - [models/User.js](#backendmodelsuserjs)
   - [models/Note.js](#backendmodelsnotejs)
   - [routes/authRoutes.js](#backendroutesauthroutesjs)
   - [routes/noteRoutes.js](#backendroutesnoteroutesjs)
   - [package.json & .env](#backendpackagejson--env)
3. [Frontend Architecture & Important Files](#3-frontend-architecture--important-files)
   - [src/main.jsx](#frontendsrcmainjsx)
   - [src/App.jsx](#frontendsrcappjsx)
   - [src/components/AuthForm.jsx](#frontendsrccomponentsauthformjsx)
   - [src/components/NoteForm.jsx](#frontendsrccomponentsnoteformjsx)
   - [src/components/NoteCard.jsx](#frontendsrccomponentsnotecardjsx)
   - [src/index.css](#frontendsrcindexcss)
   - [src/App.css](#frontendsrcappcss)
   - [index.html & vite.config.js](#frontendindexhtml--viteconfigjs)
   - [vercel.json](#frontendverceljson)
4. [Deployment & Infrastructure Files](#4-deployment--infrastructure-files)
5. [Summary Cheatsheet](#5-summary-cheatsheet)

---

## 1. Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │    Client Browser / Vercel Edge      │
                      │   (React 19, Vite, Clean Light UI)   │
                      └──────────────────┬───────────────────┘
                                         │ HTTPS / REST (JSON)
                                         │ Authorization: Bearer <JWT>
                                         ▼
                      ┌──────────────────────────────────────┐
                      │       Express REST API (Render)      │
                      │  server.js -> Middlewares -> Routes  │
                      └──────────┬────────────────┬──────────┘
                                 │                │
            /api/auth (Bcrypt, JWT)              /api/notes (Protected CRUD)
                                 │                │
                                 └────────┬───────┘
                                          ▼
                      ┌──────────────────────────────────────┐
                      │       MongoDB Atlas (Cloud DB)       │
                      │  Users Collection & Notes Collection │
                      └──────────────────────────────────────┘
```

---

## 2. Backend Architecture & Important Files

### `backend/server.js`
* **Role:** The main entry point and orchestrator for the backend server.
* **What it does:**
  1. **Loads Environment Variables:** Calls `dotenv.config()` at line 2 before any other module loads so database URIs and secrets are available.
  2. **Initializes Express:** Instantiates the Express application instance (`const app = express()`).
  3. **Registers Global Middleware:**
     - `cors()`: Enables Cross-Origin Resource Sharing so the React frontend on Vercel can make HTTP requests to the Render backend.
     - `express.json({ limit: '1mb' })`: Parses incoming JSON request payloads into `req.body` with a 1MB payload ceiling to prevent memory denial-of-service.
  4. **Mounts Route Handlers:**
     - `app.use('/api/auth', authRoutes)`: Routes for user registration, login, and profile fetching.
     - `app.use('/api/notes', noteRoutes)`: Protected routes for note CRUD operations.
  5. **Health Check Endpoint (`GET /`):** Returns server status and database connectivity (`mongoose.connection.readyState`), used by ping monitors (`cron-job.org`) to prevent Render from sleeping.
  6. **Catch-All 404 Handler:** Intercepts any unhandled endpoints and returns a standard JSON response (`{ error: 'Route not found' }`) instead of HTML.
  7. **Centralized Error Handler:** A 4-argument Express error middleware `(err, req, res, next)` that catches unhandled runtime exceptions and returns sanitized JSON errors without leaking server stack traces in production.
  8. **MongoDB Connection & Server Boot:** Establishes connection to MongoDB Atlas using `mongoose.connect(MONGO_URI)` and starts the HTTP listener on `process.env.PORT || 5000`.

---

### `backend/middleware/auth.js`
* **Role:** JSON Web Token (JWT) verification and access control middleware.
* **What it does:**
  1. **Inspects Request Headers:** Reads the incoming `Authorization` HTTP header.
  2. **Bearer Token Validation:** Checks that the header exists and follows the `Bearer <token>` format. Returns `401 Unauthorized` if absent or malformed.
  3. **Cryptographic Verification:** Uses `jwt.verify(token, JWT_SECRET)` to verify that the token has not expired and was signed with the server's private secret key.
  4. **Attaches User to Request:** Decodes the token payload containing `{ id, email, name }` and attaches it directly to `req.user`.
  5. **Invokes `next()`:** Grants access to proceed to the controller/route handler. If verification fails (e.g., token expired or manipulated), it immediately terminates the request with a `401 Unauthorized` JSON response.

---

### `backend/models/User.js`
* **Role:** Mongoose Schema and Model definition for user accounts.
* **What it does:**
  1. **Schema Definition:**
     - `name`: String, required, trimmed, capped at 100 characters.
     - `email`: String, required, unique, lowercase, trimmed, capped at 254 characters, and validated with a standard RFC email regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
     - `password`: String, required, minlength 6. Stores the one-way bcrypt hashed string (never plain text).
  2. **Timestamps:** Automatically tracks `createdAt` and `updatedAt` for every registered user.
  3. **Data Integrity:** Guarantees that duplicate emails cannot be inserted at the database index level (`unique: true`).

---

### `backend/models/Note.js`
* **Role:** Mongoose Schema and Model definition for user notes.
* **What it does:**
  1. **Schema Definition:**
     - `title`: String, required, trimmed, capped at 200 characters.
     - `content`: String, required, capped at 20,000 characters.
     - `tags`: Array of strings, defaults to empty array `[]`.
     - `pinned`: Boolean, defaults to `false`.
     - `userId`: `mongoose.Schema.Types.ObjectId`, references the `User` model, required, and indexed.
  2. **Relational Reference (Foreign Key):** Binds each note strictly to its creator's `userId`.
  3. **Compound Database Index:**
     ```javascript
     noteSchema.index({ userId: 1, pinned: -1, createdAt: -1 });
     ```
     Enables high-performance index scans (IXSCAN) for the exact dashboard query: fetching all notes for a specific user, sorted by pinned first, then newest first.

---

### `backend/routes/authRoutes.js`
* **Role:** Controllers and endpoints for authentication under `/api/auth`.
* **What it does:**
  1. **`POST /api/auth/register`:**
     - Validates payload types and lengths (`name`, `email`, `password`).
     - Checks if an account already exists with that email (`User.findOne`).
     - Hashes the plain-text password using `bcrypt.hash` with 10 salt rounds.
     - Persists the new user in MongoDB Atlas.
     - Handles MongoDB `11000` duplicate key race conditions gracefully with a `400 Bad Request`.
     - Generates a signed JWT with a 7-day expiration (`jwt.sign`) and returns `{ token, user }`.
  2. **`POST /api/auth/login`:**
     - Validates supplied email and password.
     - Queries the database for the user by lowercase normalized email.
     - Compares the plain-text password with the stored hash using `bcrypt.compare`.
     - If credentials match, generates and returns a new signed 7-day JWT and user profile.
  3. **`GET /api/auth/me`:**
     - Protected endpoint utilizing `authenticate` middleware.
     - Retrieves the currently logged-in user profile from the database (`User.findById(req.user.id).select('-password')`).

---

### `backend/routes/noteRoutes.js`
* **Role:** Protected CRUD REST API endpoints for user notes under `/api/notes`.
* **What it does:**
  1. **Applies Middleware:** `router.use(authenticate)` guarantees that every route in this file requires a valid JWT, populating `req.user.id`.
  2. **`GET /api/notes`:** Queries notes strictly belonging to the caller: `Note.find({ userId: req.user.id }).sort({ pinned: -1, createdAt: -1 })`. Strict multi-tenant data isolation.
  3. **`POST /api/notes`:** Validates title and content strings and bounds (max 200 chars for title, 20,000 for content). Deduplicates tags with a helper function. Saves the note with `userId: req.user.id`.
  4. **`PUT /api/notes/:id`:**
     - Validates MongoDB ObjectId format (`mongoose.Types.ObjectId.isValid`).
     - Retrieves the note and verifies ownership: `note.userId.toString() === req.user.id.toString()`. Returns `403 Forbidden` if another user attempts to edit it.
     - Updates fields (`title`, `content`, `tags`, `pinned`) and returns the updated note.
  5. **`DELETE /api/notes/:id`:** Verifies ID format and note ownership. Deletes the note with `Note.findByIdAndDelete(id)`. Returns `200 OK` with deleted note ID.

---

### `backend/package.json` & `.env`
* **`backend/package.json`:** Lists Node dependencies (`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`) and startup scripts (`npm start` -> `node server.js`, `npm run dev` -> `nodemon server.js`).
* **`backend/.env`:** Holds sensitive environment configurations:
  - `PORT`: HTTP port (defaults to 5000 locally, dynamically assigned on Render).
  - `MONGO_URI`: MongoDB Atlas connection string with credentials.
  - `JWT_SECRET`: Secret key used for signing and verifying JSON Web Tokens.

---

### `backend/test_api.js`
* **Role:** Automated integration testing suite verifying all backend API endpoints.
* **What it does:**
  - Performs 26 automated assertion checks using Node.js native `fetch()`.
  - Tests health check (`GET /`), JSON 404 responses, and type/length validations.
  - Tests user registration, password length bounds, RFC email regex checks, and JWT token extraction.
  - Tests MongoDB duplicate key (`E11000`) race condition handling (`400 Bad Request`).
  - Tests note creation, automatic tag deduplication (`Set`), update (`PUT`), and deletion (`DELETE`).
  - Can be executed against local development (`npm test`) or against live production (`node test_api.js https://personal-notes-8mgo.onrender.com`).

---

## 3. Frontend Architecture & Important Files

### `frontend/src/main.jsx`
* **Role:** Client-side bootstrapping script.
* **What it does:**
  - Imports `createRoot` from `react-dom/client`.
  - Imports global base styles from `index.css`.
  - Mounts the root `<App />` component inside React 19's `<StrictMode>` into the DOM element `#root`.

---

### `frontend/src/App.jsx`
* **Role:** Core application dashboard, global state manager, and API orchestrator.
* **What it does:**
  1. **Authentication State:**
     - Initializes `token` and `currentUser` from `localStorage` safely wrapped in `try/catch` to guard against corrupted storage.
     - Renders `<AuthForm />` if unauthenticated; renders the full dashboard if authenticated.
  2. **API Base URL Sanitization:**
     ```javascript
     const rawApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
     const API_BASE = rawApiBase.replace(/\/+$/, '');
     ```
     Automatically strips any trailing slashes from the environment variable to prevent double-slash 404 routing bugs.
  3. **Notes State & Sorting (`sortNotesList`):**
     Maintains the array of notes in local state. Uses a standardized sorting algorithm ensuring pinned notes always stay on top and notes are sorted newest first.
  4. **CRUD Actions:**
     - `fetchNotes()`: Loads notes from `GET /api/notes` on initial mount or login.
     - `handleFormSubmit()`: Handles both note creation (`POST`) and updates (`PUT`).
     - `handleDeleteNote()`: Deletes notes via `DELETE /api/notes/:id`.
     - `handleTogglePin()`: Toggles pinned state via `PUT /api/notes/:id`.
  5. **Real-Time Client-Side Search:**
     Filters notes instantaneously by title or comma-separated tags based on `searchTitle` state without re-querying the database.
  6. **Safe Error Parsing:**
     All `fetch` calls use `.json().catch(() => null)` so that HTML error pages (e.g., 502/504 proxy timeouts) never crash the app.

---

### `frontend/src/components/AuthForm.jsx`
* **Role:** Tabbed card for User Sign In and Account Registration.
* **What it does:**
  1. **Segmented Tabs:** Switches between `Sign In` (`isLoginMode = true`) and `Create Account` (`isLoginMode = false`) without losing already-typed email or passwords.
  2. **Client-side Validation:** Checks that names are provided on signup, emails are non-empty, and passwords are at least 6 characters long before making API calls.
  3. **Endpoint Dispatching:** Routes to either `/api/auth/login` or `/api/auth/register`.
  4. **Error Handling:** Displays inline error banners when authentication fails (e.g., incorrect password, duplicate email).
  5. **Success Callback:** Calls `onAuthSuccess(token, user)` on successful response to update the root App state and persist session data into `localStorage`.

---

### `frontend/src/components/NoteForm.jsx`
* **Role:** Controlled form component for creating new notes or editing existing ones.
* **What it does:**
  1. **Dynamic Mode Switching:**
     - If `editingNote` is provided via props, populates the fields with that note's title, content, tags, and pinned state.
     - If `editingNote` is null, operates in "Create a New Note" mode.
  2. **Input Constraints:**
     - Enforces `maxLength={200}` on note title.
     - Enforces `maxLength={20000}` on note content textarea.
  3. **Tag Parsing & Deduplication:**
     Splits comma-separated inputs by commas, trims whitespace, caps each tag at 50 chars, and deduplicates identical tags using `[...new Set(rawTags)]`.
  4. **Submission & Reset:** Passes sanitized note data to parent `onSubmit()` and automatically resets the form on creation.

---

### `frontend/src/components/NoteCard.jsx`
* **Role:** Presentation component for rendering individual note cards in the responsive grid.
* **What it does:**
  1. **Dynamic Styling:** Adds the `.is-pinned` CSS class when `note.pinned` is true, styling the card with warm amber borders and backgrounds.
  2. **Pin Toggle Button:** Clicking the pin button calls `onTogglePin(note)`, which updates the note on the server and toggles between "Pin" and "📌 Pinned".
  3. **Tag Rendering:** Renders tag pills (`#tag`) using a composite key `key={`${tag}-${index}`}` to avoid React list-rendering warnings.
  4. **Date Formatting:** Converts ISO timestamps (`createdAt`) into human-readable dates (e.g., `Oct 15, 2026`).
  5. **Actions:** Provides "Edit" (scrolls to top and loads note into form) and "Delete" (prompts browser confirmation before invoking parent deletion).

---

### `frontend/src/index.css`
* **Role:** Global design system tokens and base element defaults.
* **What it does:**
  - Imports modern typography (`Plus Jakarta Sans` and `JetBrains Mono`) from Google Fonts.
  - Defines CSS variables for the clean light theme:
    - Canvas background: `--bg-primary: #f8fafc;`
    - Card surfaces: `--bg-surface: #ffffff;`
    - Text hierarchy: `--text-main: #0f172a;`, `--text-secondary: #334155;`, `--text-muted: #64748b;`
    - Borders: `--border-subtle: #e2e8f0;`, `--border-focus: #2563eb;`
    - Amber pin accents: `--pinned-bg: #fffdf5;`, `--pinned-border: #fcd34d;`, `--pinned-text: #92400e;`
  - Normalizes base styles (`box-sizing: border-box;`, `margin: 0;`).

---

### `frontend/src/App.css`
* **Role:** Layout, component rules, micro-interactions, and responsive media queries.
* **What it does:**
  - Layout: Centers `.app-container` with max-width `1040px`.
  - Responsive Grid: Defines `.notes-grid` using CSS Grid with auto-fill (`repeat(auto-fill, minmax(300px, 1fr))`).
  - Cards: Implements 1px hairline borders (`#e2e8f0`), subtle elevation, and smooth hover translations (`transform: translateY(-1px)`).
  - Pinned State: Styles `.note-card.is-pinned` with honey/amber accents.
  - User Bar: Styles the rounded pill user status bar with initials avatar.
  - Breakpoints: Media queries for mobile viewports (`max-width: 640px`) adjusting padding, font sizes, and button stacking.

---

### `frontend/index.html` & `frontend/vite.config.js`
* **`frontend/index.html`:** The HTML5 host document containing viewport meta tags, favicon reference, page title (`Personal Notes`), and the `#root` mount container for React.
* **`frontend/vite.config.js`:** Configures the Vite build tool and bundler with `@vitejs/plugin-react` for JSX transformation, Hot Module Replacement (HMR), and minified production bundles.

---

### `frontend/vercel.json`
* **Role:** Single-Page Application (SPA) routing configuration for Vercel.
* **What it does:**
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
  Redirects all deep client-side URL requests to `/index.html` so client-side routes never return a 404 on Vercel CDN edges.

---

## 4. Deployment & Infrastructure Files

| Layer | Hosting Provider | Configuration & Role |
|---|---|---|
| **Database** | **MongoDB Atlas** | Cloud MongoDB M0 cluster (`notes_db`). Stores `users` and `notes` collections. Network access configured for `0.0.0.0/0`. |
| **Backend API** | **Render.com** | Web Service (`personal-notes-8mgo.onrender.com`). Runs `node server.js` in the `backend/` directory with `MONGO_URI` and `JWT_SECRET`. |
| **Frontend UI** | **Vercel.com** | Static CDN site. Automatically builds `frontend/` using Vite (`npm run build`) and connects to the backend via `VITE_API_URL`. |
| **Keep-Alive Ping** | **cron-job.org** | External cron monitor that sends a `GET` request to `https://personal-notes-8mgo.onrender.com/` every 10 minutes to prevent Render free-tier sleep. |

---

## 5. Summary Cheatsheet

```text
Personal-Notes/
├── backend/
│   ├── middleware/
│   │   └── auth.js            # Verifies JWT Bearer token & attaches req.user
│   ├── models/
│   │   ├── Note.js            # Note schema, userId foreign key & compound index
│   │   └── User.js            # User schema, email regex & bcrypt password hash
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth: register, login, me
│   │   └── noteRoutes.js      # /api/notes: protected GET, POST, PUT, DELETE
│   ├── .env                   # Secret credentials (PORT, MONGO_URI, JWT_SECRET)
│   ├── package.json           # Backend scripts & npm dependencies
│   ├── server.js              # Express app, CORS, DB connection, 404 & error handlers
│   └── test_api.js            # Automated 26-assertion integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthForm.jsx   # Sign in & registration tabs with validation
│   │   │   ├── NoteCard.jsx   # Individual note card, pin toggle, delete prompt
│   │   │   └── NoteForm.jsx   # Create/Edit note form, tag deduplication
│   │   ├── App.jsx            # State manager, search filter, API client
│   │   ├── App.css            # Component styles, light theme & responsive layout
│   │   ├── index.css          # Design system tokens, variables & typography
│   │   └── main.jsx           # React 19 entry point mounting to #root
│   ├── index.html             # Host HTML document
│   ├── package.json           # Frontend dependencies, Vite & oxlint scripts
│   ├── vercel.json            # Vercel SPA rewrite rule
│   └── vite.config.js         # Vite bundler & React plugin config
├── PROJECT_FILES_REPORT.md    # Comprehensive code & file explanation guide (this file)
├── PROJECT_NOTES.md           # 75 examination & interview Q&As
└── README.md                  # Project documentation & deployment walkthrough
```
