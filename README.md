# 📝 Personal Notes App (MERN Stack)

A modern Personal Notes web application built with **React**, **Node.js**, **Express.js**, and **MongoDB with Mongoose**.

---

## 📌 Project Overview

This repository is split into two directories:
- `backend/`: Node.js & Express server connected to MongoDB via Mongoose.
- `frontend/`: Fast React single-page application built with Vite.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local Community Server or MongoDB Atlas cluster)

---

### 1. Setup Backend
```bash
cd backend
npm install
```

Configure your environment variables:
- Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
- In `backend/.env`, verify your port and MongoDB connection string:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/notes_db
```

Start the backend development server:
```bash
npm run dev
```
> Server runs on `http://localhost:5000`

---

### 2. Setup Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
> Client runs on `http://localhost:5173`

---

## 🏗️ Architecture & Models

### Note Model (`backend/models/Note.js`)
| Field | Type | Description |
|---|---|---|
| `title` | `String` | Required, trimmed note title |
| `content` | `String` | Required note body content |
| `tags` | `[String]` | Array of tag strings (default: `[]`) |
| `pinned` | `Boolean` | Pin status (default: `false`) |
| `userId` | `ObjectId` | Reference to note owner (`User` model) |
| `createdAt` / `updatedAt` | `Date` | Managed automatically via Mongoose timestamps |

---

## 🔐 Authentication API Reference (`/api/auth`)

| Method | Endpoint | Description | Request Body (JSON) |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | `{ "name": "...", "email": "...", "password": "..." }` |
| `POST` | `/api/auth/login` | Login & receive JWT | `{ "email": "...", "password": "..." }` |
| `GET` | `/api/auth/me` | Current user profile | None (`Bearer <token>` header required) |

---

## 📡 REST API Reference (`/api/notes`) *(All require `Authorization: Bearer <token>`)*

| Method | Endpoint | Description | Request Body (JSON) |
|---|---|---|---|
| `GET` | `/api/notes` | Get notes owned by authenticated user | None |
| `POST` | `/api/notes` | Create a note (userId derived from token) | `{ "title": "...", "content": "...", "tags": [], "pinned": false }` |
| `PUT` | `/api/notes/:id` | Update note (enforces owner check) | `{ "title": "...", "content": "..." }` |
| `DELETE` | `/api/notes/:id` | Delete note (enforces owner check) | None |

---

## 📅 Roadmap
- [x] **Day 1:** Project scaffolding, Express + MongoDB connection, Note schema, and diagnostic dashboard.
- [x] **Day 2:** Note CRUD API endpoints (Create, Read, Update, Delete) with validation and ownership simulation.
- [x] **Day 3:** React Notes Dashboard (Note cards, create/edit form, delete, pin toggle, fetch integration).
- [x] **Day 4:** User Authentication (JWT / bcrypt) & user-specific note ownership and search.
