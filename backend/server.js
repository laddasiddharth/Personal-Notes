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

// 4. Root endpoint
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

// 7. Connect to MongoDB and start Express server
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Connection Error:', err.message);
    process.exit(1);
  }
};

startServer();
