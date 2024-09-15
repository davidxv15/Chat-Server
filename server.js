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
    socket.user = { id: decoded.id, username: decoded.username || "Anonymous" };

    console.log("Client connected with user ID:", socket.user.id);

    // Store the room the user joins
    let currentRoom = null;

    socket.on("message", (message) => {
      let messageData;

      try {
        messageData = JSON.parse(message);
      } catch (e) {
        console.error("Message is not JSON:", message);
        return;
      }

      // Handle room joining
      if (messageData.type === "join") {
        currentRoom = messageData.room; // Track the current room
        socket.room = currentRoom;
        socket.user.username = messageData.username;
        console.log(
          `${socket.user.username || "Unknown User"} joined: ${currentRoom}`
        );
      }

      // Handle typing events
      if (messageData.type === "typing" && messageData.room) {
        wss.clients.forEach((client) => {
          if (
            client.room === messageData.room &&
            client.readyState === client.OPEN
          ) {
            client.send(
              JSON.stringify({
                type: "typing",
                username: messageData.username,
                room: messageData.room,
                typing: messageData.typing,
              })
            );
          }
        });
      }

      // Broadcast message only to the current room users
      if (messageData.type === "message" && currentRoom) {
        const jsonString = JSON.stringify({
          username: socket.user.username || "Anonymouss",
          message: messageData.message,
          room: currentRoom,
        });


        
        // Broadcast to everyone in the same room
        wss.clients.forEach((client) => {
          if (
            client.room === currentRoom &&
            client.readyState === client.OPEN
          ) {
            client.send(jsonString);
          }
        });
      }
    });

    socket.on("close", () => {
      console.log(
        `${socket.user.username} disconnected from room: ${currentRoom}`
      );
    });
  } catch (error) {
    console.error("Token verification failed:", error.message);
    socket.close(4002, "Token invalid");
  }
});

console.log("WebSocket server is running on ws://localhost:3000");
