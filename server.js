const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('ws'); // my WebSocket lib import
const jwt = require('jsonwebtoken'); // Import JWT library
const authRoutes = require('./routes/auth');
const { protect } = require('./middleware/auth');

require('dotenv').config();

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to MongoDB Atlas');
});


app.use('/api/auth', authRoutes);

const server = app.listen(3000, () => {
  console.log('Server running on port 3000');
});

const wss = new Server({ server, path: '/ws' });

wss.on('connection', (socket, req) => {
  // Extract the token from the URL query string
  const token = req.url.split('token=')[1];
  if (!token) {
    socket.close(4001, 'No token provided');
    return;
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, 'your_jwt_secret');
    socket.user = decoded.id; // Save the decoded user ID in the socket

    console.log('Client connected with user ID:', socket.user);

    socket.on('message', (message) => {
      console.log('Received:', message.toString());

      // Broadcast the message to ALL clients. think 'open back and forth'
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(message.toString());
        }
      });
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.on('close', (code, reason) => {
      console.log(`Client disconnected (code: ${code}, reason: ${reason})`);
    });
  } catch (error) {
    console.log.error('Token verification failed:', error.message);
    socket.close(4002, 'Token invalid');
  }
});

console.log('WebSocket server is running on ws://localhost:3000');
