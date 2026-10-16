// 1. Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Note routes
const noteRoutes = require('./routes/noteRoutes');

// 2. Initialize Express application
const app = express();

// 3. Middlewares
app.use(cors());
app.use(express.json());

// 4. Root endpoint (displays server status instead of "Cannot GET /")
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Personal Notes API is running!',
    endpoint: '/api/notes',
  });
});

// 5. Mount API routes
app.use('/api/notes', noteRoutes);

// 6. Port and MongoDB URI from .env
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notes_db';

// 7. Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });

// 8. Start listening for incoming requests
app.listen(PORT, () => {
  console.log(`🚀 Express server is running on http://localhost:${PORT}`);
});
