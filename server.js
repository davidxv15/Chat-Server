const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('ws');
const authRoutes = require('./routes/auth'); 
const { protect } = require('./middleware/auth'); 

const app = express();
app.use(express.json()); // For parsing application/json

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Use authentication routes
app.use('/api/auth', authRoutes);

// Create an HTTP server to handle both Express and WebSocket
const server = app.listen(3000, () => {
  console.log('Server running on port 3000');
});

// WebSocket setup
const wss = new Server({ server, path: '/ws' });

wss.on('connection', (socket, req) => {
  const token = req.url.split('token=')[1];
  if (!token) {
    socket.close(4001, 'No token provided');
    return;
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    socket.user = decoded.id;

    console.log('Client connected');

    socket.on('message', (message) => {
      console.log('Received:', message.toString());

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
