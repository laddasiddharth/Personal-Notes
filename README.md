# Personal Notes App

A full-stack note-taking web application built with the MERN stack (MongoDB, Express.js, React, Node.js). Users can create, view, edit, delete, search, tag, and pin notes through a clean, responsive interface backed by a REST API.

---

## Features

- **Note Management (CRUD):**
  - Create new notes with title, content, tags, and pin status.
  - Read/view all saved notes, automatically ordered with pinned notes at the top.
  - Edit existing note details and update them in real time.
  - Delete notes with a browser confirmation prompt.
- **Pinning:**
  - One-click pin/unpin toggle directly from the note card or during editing.
- **Tagging:**
  - Add comma-separated tags to organize notes.
  - Automatic whitespace trimming and deduplication.
- **Search & Filtering:**
  - Live client-side search filtering across both note titles and tags as you type.

---

## Tech Stack

- **Frontend:** React, Vite, Vanilla CSS
- **Backend:** Node.js, Express.js, CORS, Dotenv
- **Database:** MongoDB Atlas, Mongoose ODM
- **Deployment:** Vercel (Frontend), Render (Backend)

---

## Project Structure

```text
Personal-Notes/
├── backend/
│   ├── models/
│   │   └── Note.js          # Mongoose schema for notes (title, content, tags, pinned)
│   ├── routes/
│   │   └── noteRoutes.js    # Express routes for Note CRUD operations
│   ├── .env.example         # Template for environment variables
│   ├── package.json         # Backend dependencies & scripts
│   └── server.js            # Express server entry point & MongoDB connection
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NoteCard.jsx # Note card component with edit, delete, and pin actions
│   │   │   └── NoteForm.jsx # Form component for creating and editing notes
│   │   ├── App.jsx          # Main application component & API handlers
│   │   ├── App.css          # App layout and component styles
│   │   ├── index.css        # Base styling and typography
│   │   └── main.jsx         # React application entry point
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies & scripts
│   ├── vercel.json          # SPA routing configuration for Vercel
│   └── vite.config.js       # Vite configuration
└── README.md
```

---

## Database Schema

### Note Model (`backend/models/Note.js`)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `title` | String | Yes | — | Title of the note (max 200 characters) |
| `content` | String | Yes | — | Body content of the note (max 20,000 characters) |
| `tags` | Array of Strings | No | `[]` | Categorization tags |
| `pinned` | Boolean | No | `false` | Whether the note is pinned to the top |
| `createdAt` | Date | Auto | Current timestamp | Timestamp when note was created |
| `updatedAt` | Date | Auto | Current timestamp | Timestamp when note was last modified |

```javascript
const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 20000 },
    tags: { type: [String], default: [] },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index to optimize dashboard query: pinned notes first, then newest
noteSchema.index({ pinned: -1, createdAt: -1 });
```

---

## REST API Documentation

Base path: `/api/notes`

### 1. Get All Notes
* **Endpoint:** `GET /api/notes`
* **Description:** Retrieves all notes sorted by pinned status (descending) and creation date (newest first).
* **Response:** `200 OK`
```json
[
  {
    "_id": "6734abcd1234567890ef0001",
    "title": "College To-Do List",
    "content": "Submit assignment, prepare for seminar.",
    "tags": ["college", "todo"],
    "pinned": true,
    "createdAt": "2026-10-16T10:00:00.000Z",
    "updatedAt": "2026-10-16T10:00:00.000Z"
  }
]
```

### 2. Create Note
* **Endpoint:** `POST /api/notes`
* **Description:** Creates a new note.
* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "title": "Project Meeting",
  "content": "Discuss project milestones with guide.",
  "tags": ["project", "college"],
  "pinned": false
}
```
* **Response:** `201 Created` (returns the created note object).

### 3. Update Note
* **Endpoint:** `PUT /api/notes/:id`
* **Description:** Updates fields of an existing note by ID.
* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "title": "Updated Meeting Notes",
  "pinned": true
}
```
* **Response:** `200 OK` (returns the updated note object).

### 4. Delete Note
* **Endpoint:** `DELETE /api/notes/:id`
* **Description:** Deletes a note by ID.
* **Response:** `200 OK`
```json
{
  "message": "Note deleted successfully",
  "id": "6734abcd1234567890ef0001"
}
```

---

## Local Setup & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)
* Git

### 1. Clone the repository
```bash
git clone https://github.com/laddasiddharth/Personal-Notes.git
cd Personal-Notes
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory based on `.env.example`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/notes_db?retryWrites=true&w=majority
```

Start the backend server:
```bash
# Development mode (auto-restarts on changes)
npm run dev

# Or standard start
npm start
```
The server will run on `http://localhost:5000`.

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Deployment

### Backend (Render)
1. Create a Web Service on [Render](https://render.com/) pointing to this repository.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
3. Add Environment Variable:
   - `MONGO_URI`: Your MongoDB Atlas connection string.

### Frontend (Vercel)
1. Import the project on [Vercel](https://vercel.com/).
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable (Type: **Config**):
   - `VITE_API_URL`: Your deployed Render backend URL (e.g., `https://your-backend.onrender.com` without trailing slash).

---

## License

This project is licensed under the ISC License.
