// 1. Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import the Note model and note routes
const Note = require('./models/Note');
const noteRoutes = require('./routes/noteRoutes');

// 2. Initialize Express application
const app = express();

// 3. Middlewares
app.use(cors());
app.use(express.json());

// 4. Mount API routes
app.use('/api/notes', noteRoutes);

// 5. Port and MongoDB URI from .env
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notes_db';

// 6. Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });

// 7. Start listening for incoming requests
app.listen(PORT, () => {
  console.log(`🚀 Express server is running on http://localhost:${PORT}`);
});
