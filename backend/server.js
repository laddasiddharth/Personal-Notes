// 1. Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import the Note model to ensure schema registration
const Note = require('./models/Note');

// 2. Initialize Express application
const app = express();

// 3. Middlewares
app.use(cors()); // Allow requests from React frontend
app.use(express.json()); // Allow server to receive JSON in request body

// 4. Test Route to verify server and database status
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

// 5. Port and MongoDB URI from .env
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notes_db';

// 6. Connect to MongoDB
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

// 7. Start listening for incoming requests
app.listen(PORT, () => {
  console.log(`🚀 Express server is running on http://localhost:${PORT}`);
  console.log(`👉 Open http://localhost:${PORT} in your browser or test from React frontend.`);
});
