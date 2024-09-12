const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("ws"); // WebSocket import
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/auth");
const { protect } = require("./middleware/auth");

require("dotenv").config();

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB Atlas");
});

app.use("/api/auth", authRoutes);

const server = app.listen(3000, () => {
  console.log("Server running on port 3000");
});

// WebSocket server
const wss = new Server({ server, path: "/ws" });

// Keep track of clients in each room
const rooms = {};

wss.on("connection", (socket, req) => {
  // Extract the token from the URL query string
  const token = req.url.split("token=")[1];
  if (!token) {
    socket.close(4001, "No token provided");
    return;
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, "your_jwt_secret");
    socket.user = { id: decoded.id, username: decoded.username };

    console.log("Client connected with user ID:", socket.user.id);

    // Store the room the user joins
    let currentRoom = null;

    socket.on("message", (message) => {
      try {
        const messageData = JSON.parse(message);
        
        if (messageData.type === 'join') {
          // Handle user joining a room
          currentRoom = messageData.room;

          if (!rooms[currentRoom]) {
            rooms[currentRoom] = [];
          }

          rooms[currentRoom].push(socket);
          console.log(`${socket.user.username} joined room: ${currentRoom}`);
        } else if (messageData.type === 'message') {
          // Broadcast the message to clients in the same room
          if (currentRoom && rooms[currentRoom]) {
            rooms[currentRoom].forEach(client => {
              if (client !== socket && client.readyState === client.OPEN) {
                client.send(JSON.stringify({
                  username: socket.user.username,
                  message: messageData.message,
                  timestamp: new Date().toLocaleTimeString(),
                  room: currentRoom
                }));
              }
            });
          }
        }
      } catch (e) {
        console.error("Invalid message format", e);
      }
    });

    socket.on("close", () => {
      // Remove the client from the room when disconnected
      if (currentRoom && rooms[currentRoom]) {
        rooms[currentRoom] = rooms[currentRoom].filter(client => client !== socket);
        console.log(`${socket.user.username} left room: ${currentRoom}`);
      }
    });

  } catch (error) {
    console.error("Token verification failed:", error.message);
    socket.close(4002, "Token invalid");
  }
});

console.log("WebSocket server is running on ws://localhost:3000");
