const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('ws');
const jwt = require('jsonwebtoken'); // Import JWT library
const authRoutes = require('./routes/auth');
const { protect } = require('./middleware/auth');

require('dotenv').config();

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());


mongoose.connect('mongodb://localhost:27017/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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

      // Broadcast the message to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.on('close', () => {
      console.log('Client disconnected');
    });
  } catch (error) {
    socket.close(4002, 'Token invalid');
  }
});

console.log('WebSocket server is running on ws://localhost:3000');
