// 1. Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import the Note and User models and route handlers
const Note = require('./models/Note');
const User = require('./models/User');
const noteRoutes = require('./routes/noteRoutes');
const authRoutes = require('./routes/authRoutes');

// 2. Initialize Express application
const app = express();

// 3. Middlewares
app.use(cors()); // Allow requests from React frontend
app.use(express.json({ limit: '1mb' })); // Allow server to receive JSON up to 1MB

// 4. Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// 5. Test Route to verify server and database status
app.get('/', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: 'online',
    message: 'Personal Notes App API is up and running!',
    databaseStatus: isDbConnected ? 'Connected' : 'Disconnected',
    mongooseReadyState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
  });
});

// 6. 404 Handler for undefined routes (always return JSON)
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// 7. Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// 8. Port and MongoDB URI from .env
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notes_db';

// 9. Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    console.log(`📦 Database: ${mongoose.connection.name || 'notes_db'}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('💡 Tip: Make sure MongoDB is running locally (e.g., mongod / MongoDB Compass),');
    console.log('       or supply a valid MongoDB Atlas connection string in backend/.env');
  });

// 10. Start listening for incoming requests
app.listen(PORT, () => {
  console.log(`🚀 Express server is running on http://localhost:${PORT}`);
  console.log(`👉 Open http://localhost:${PORT} in your browser or test from React frontend.`);
});
