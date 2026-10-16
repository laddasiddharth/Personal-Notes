# Personal Notes App — Project Files Reference

A complete breakdown of every file in the project, its purpose, the functions/components it defines, and how data flows through the application.

---

## Quick Navigation

- [Backend Architecture](#backend-architecture)
  - [server.js](#1-backendserverjs)
  - [models/Note.js](#2-backendmodelsnotejs)
  - [routes/noteRoutes.js](#3-backendroutesnoteroutesjs)
  - [package.json & .env](#4-backend-configuration-files)
- [Frontend Architecture](#frontend-architecture)
  - [src/App.jsx](#1-frontendsrcappjsx)
  - [src/components/NoteForm.jsx](#2-frontendsrccomponentsnoteformjsx)
  - [src/components/NoteCard.jsx](#3-frontendsrccomponentsnotecardjsx)
  - [src/App.css & src/index.css](#4-frontendsrcappcss--srcindexcss)
  - [src/main.jsx & index.html](#5-frontendsrcmainjsx--indexhtml)
  - [vercel.json & vite.config.js](#6-frontend-configuration-files)
- [How Data Flows (Request Lifecycle)](#how-data-flows-request-lifecycle)

---

## Backend Architecture

The backend is built with **Node.js** and **Express.js**, connecting to **MongoDB Atlas** using **Mongoose**.

### 1. `backend/server.js`
* **Role:** Application entry point and server bootstrap.
* **Key Responsibilities:**
  1. **Environment Config:** Loads `PORT` and `MONGO_URI` using `dotenv`.
  2. **Middleware:** 
     - `cors()`: Enables Cross-Origin Resource Sharing so the React frontend can make API requests.
     - `express.json()`: Parses incoming JSON request payloads.
  3. **Route Mounting:** Mounts note CRUD routes at the `/api/notes` prefix.
  4. **Database Connection:** Connects to MongoDB Atlas via `mongoose.connect()`.
  5. **Listener:** Starts the HTTP server on port 5000 (or the port specified by Render).

---

### 2. `backend/models/Note.js`
* **Role:** Data model and schema definition for stored notes.
* **Schema Fields:**

| Field | Type | Validation / Constraints | Description |
|---|---|---|---|
| `title` | `String` | `required: true`, `trim: true`, `maxlength: 200` | Title of the note |
| `content` | `String` | `required: true`, `maxlength: 20000` | Full text body of the note |
| `tags` | `[String]` | `default: []` | Array of category tags |
| `pinned` | `Boolean` | `default: false` | Whether the note is pinned to the top |
| `createdAt` | `Date` | Managed automatically by `{ timestamps: true }` | Timestamp of creation |
| `updatedAt` | `Date` | Managed automatically by `{ timestamps: true }` | Timestamp of last edit |

* **Indexing:**
  ```javascript
  noteSchema.index({ pinned: -1, createdAt: -1 });
  ```
  Creates a compound index so MongoDB sorts notes (pinned first, newest first) directly at the database level rather than sorting in application memory.

---

### 3. `backend/routes/noteRoutes.js`
* **Role:** Express router defining the 4 REST API endpoints.
* **Helper Function:**
  - `sanitizeTags(tags)`: Trims whitespace, removes non-strings, removes empty values, deduplicates tags using `Set`, and caps length to 30 tags.
* **Endpoints Defined:**

| Method | Route | Handler Responsibility | Expected Response |
|---|---|---|---|
| `GET` | `/` | Queries `Note.find()` sorted by pinned and date | `200 OK` + Array of note objects |
| `POST` | `/` | Validates `title` and `content`, creates and saves new Note document | `201 Created` + Saved note object |
| `PUT` | `/:id` | Validates `id` format (`ObjectId.isValid`), finds note, updates provided fields, and saves | `200 OK` + Updated note object |
| `DELETE` | `/:id` | Validates `id` format, calls `Note.findByIdAndDelete(id)` | `200 OK` + `{ message, id }` |

---

### 4. Backend Configuration Files

* **`backend/package.json`**:
  - `dependencies`: `express`, `mongoose`, `cors`, `dotenv`.
  - `devDependencies`: `nodemon` (auto-restarts server during development).
  - `scripts`: `"start": "node server.js"`, `"dev": "nodemon server.js"`.
* **`backend/.env.example`**:
  - Template showing required environment variables (`PORT=5000`, `MONGO_URI=...`).
* **`backend/.env`**:
  - Local environment variables containing your active MongoDB Atlas connection string (excluded from git via `.gitignore`).

---

## Frontend Architecture

The frontend is a **Single Page Application (SPA)** built with **React** and bundled using **Vite**.

### 1. `frontend/src/App.jsx`
* **Role:** Central state coordinator and main page layout.
* **State Variables Managed:**
  - `notes`: Array containing all notes fetched from the backend.
  - `isLoading`: Boolean controlling the loading spinner indicator.
  - `errorMessage`: String holding network/server error messages for the banner.
  - `editingNote`: Holds the note object currently selected for editing (or `null` when creating).
  - `isSubmitting`: Boolean disabling buttons while an API call is in progress.
  - `searchTitle`: String holding the current text in the search input.
* **Functions & Handlers:**
  - `sortNotesList(notesList)`: Sorts notes array with pinned notes first, then by date descending.
  - `fetchNotes()`: Calls `GET /api/notes` on initial load and stores the list in state.
  - `handleFormSubmit(formData)`:
    - If `editingNote` is active: sends `PUT /api/notes/:id` and updates note in state.
    - If no note is being edited: sends `POST /api/notes` and prepends new note to state.
  - `handleDeleteNote(id)`: Sends `DELETE /api/notes/:id` and filters out the note from state.
  - `handleTogglePin(note)`: Sends `PUT /api/notes/:id` with `{ pinned: !note.pinned }` to pin/unpin with 1 click.
  - `filteredNotes`: Filters `notes` live based on `searchTitle` matching either `note.title` or any tag in `note.tags`.

---

### 2. `frontend/src/components/NoteForm.jsx`
* **Role:** Form component for creating new notes and editing existing ones.
* **Props Received:**
  - `onSubmit(formData)`: Callback to parent handler.
  - `editingNote`: Note object being edited (or `null`).
  - `onCancelEdit()`: Callback to clear edit mode and reset form.
  - `isSubmitting`: Boolean indicating if a save request is in-flight.
* **Internal Form State:**
  - `title`: Input text for note title.
  - `content`: Textarea value for note body.
  - `tagsInput`: Comma-separated string for tags.
  - `pinned`: Checkbox boolean state.
  - `formError`: Client-side validation message (e.g., missing title/content).
* **Key Logic:**
  - `useEffect`: Whenever `editingNote` changes, form fields automatically populate with that note's values. When cancelled or completed, fields reset to blank.
  - Validates character counts (title <= 200, content <= 20,000).
  - Splits comma-separated tags into a clean deduplicated array before submission.

---

### 3. `frontend/src/components/NoteCard.jsx`
* **Role:** Card presentation component for an individual note.
* **Props Received:**
  - `note`: Note object containing `_id`, `title`, `content`, `tags`, `pinned`, `createdAt`.
  - `onEdit(note)`: Triggered when user clicks "Edit" button.
  - `onDelete(id)`: Triggered when user confirms deletion.
  - `onTogglePin(note)`: Triggered when user clicks the pin badge.
* **Key Features:**
  - Formats `createdAt` into a human-readable date string (e.g., "Oct 16, 2026").
  - Highlights pinned notes with a distinct pinned border and badge style.
  - Renders tag pills with `#` prefix.
  - `handleDelete`: Prompts a browser confirmation dialog (`window.confirm`) to prevent accidental deletion.

---

### 4. `frontend/src/App.css` & `src/index.css`
* **`index.css`**: Global design tokens and reset styles.
  - Defines CSS custom properties (`--bg-primary`, `--accent`, `--pinned-bg`, `--border-subtle`).
  - Sets modern typography using Google Fonts (`Plus Jakarta Sans` and `JetBrains Mono`).
* **`App.css`**: Component-level styling.
  - Responsive CSS grid (`notes-grid`) for note cards that adapts across mobile, tablet, and desktop screens.
  - Form card styling, inputs, button states (hover, disabled), search bar, and empty state boxes.

---

### 5. `frontend/src/main.jsx` & `index.html`
* **`index.html`**: Host HTML document with `<div id="root"></div>`, meta tags, and title.
* **`main.jsx`**: JavaScript entry point that uses `createRoot` from `react-dom/client` to mount `<App />` into `#root`.

---

### 6. Frontend Configuration Files

* **`frontend/vercel.json`**:
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
  Instructs Vercel's edge servers to redirect all routing paths back to `index.html` so client-side routing and page reloads work smoothly.
* **`frontend/vite.config.js`**:
  Configures Vite with the official React plugin (`@vitejs/plugin-react`).
* **`frontend/.env.example`**:
  Documents `VITE_API_URL` pointing to backend base URL.

---

## How Data Flows (Request Lifecycle)

```
[ User Action in Browser ]
         │
         ▼
[ React Component (NoteForm / NoteCard / Search Bar) ]
         │
         ▼
[ App.jsx State Handler ]
         │
         ▼  HTTP Request via fetch() (GET / POST / PUT / DELETE)
[ Express Server (backend/server.js) ]
         │
         ▼
[ Express Router (backend/routes/noteRoutes.js) ]
         │
         ▼  Mongoose Model Query (find / save / findByIdAndUpdate / findByIdAndDelete)
[ MongoDB Atlas Database (notes_db ➔ notes collection) ]
         │
         ▼  JSON Document Response
[ App.jsx updates React State (setNotes) ]
         │
         ▼  Re-render
[ Browser Screen Displays Updated Cards Immediately ]
```

---

## Summary Table

| File | Primary Language | Function / Purpose |
| :--- | :--- | :--- |
| **`backend/server.js`** | JavaScript (Node.js) | Server entry, CORS, routes mount, Mongo connection |
| **`backend/models/Note.js`** | JavaScript (Mongoose) | Note schema, validation rules, compound index |
| **`backend/routes/noteRoutes.js`** | JavaScript (Express) | 4 CRUD API endpoints (`GET`, `POST`, `PUT`, `DELETE`) |
| **`frontend/src/App.jsx`** | JavaScript (React JSX) | Application root, state management, API calls, search |
| **`frontend/src/components/NoteForm.jsx`** | JavaScript (React JSX) | Controlled create & edit form with tag parser |
| **`frontend/src/components/NoteCard.jsx`** | JavaScript (React JSX) | Note display card with edit, delete, pin buttons |
| **`frontend/src/App.css`** | CSS | Responsive grid, cards, form and button styling |
| **`frontend/src/index.css`** | CSS | Color palette, design variables, and global fonts |
| **`frontend/vercel.json`** | JSON | Vercel rewrite configuration for clean routing |
| **`README.md`** | Markdown | Repository overview, API documentation & setup guide |
