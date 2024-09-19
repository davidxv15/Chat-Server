const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("ws"); // my WebSocket lib import
const jwt = require("jsonwebtoken"); // Import JWT library
const authRoutes = require("./routes/auth");
const { protect } = require("./middleware/auth");

require("dotenv").config();

const app = express();
app.use(express.json());  // Middleware to parse JSON request bodies

const cors = require("cors");
app.use(cors()); // Enabling CORS for cross-origin requests

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

const wss = new Server({ server, path: "/ws" });

// Keep track of clients in each room
const rooms = {}; // { roomName: [user1, user2, ...] }

// Function to broadcast the updated user list to all clients in the room
const broadcastUserList = (room) => {
  const updatedUserList = rooms[room] || [];

  // Broadcast the updated user list to all clients in the room
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(
        JSON.stringify({
          type: "userListUpdate",
          room: room,
          users: updatedUserList,
        })
      );
    }
  });
};

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
    socket.user = { id: decoded.id, username: decoded.username }; // setting to use username
    console.log("Client connected with user ID:", socket.user.id);

    // Keep track of the rooms the user joins
    socket.userRooms = [];

    socket.on("message", (message) => {
      console.log("Received:", message.toString());
      // Ensure the message as a JSON string
      let messageData;
      
      try {
        messageData = JSON.parse(message);
      } catch (e) {
        console.error("Message is not JSON, sending as string:", message);
        messageData = { username: socket.user.username, message };
      }

      const jsonString = JSON.stringify(messageData);

      // Broadcast the JSONmessage to ALL clients. think 'open back and forth'
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(jsonString); // Send the message as it was received (already JSON-stringified)
        }
      });
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    socket.on("close", (code, reason) => {
      console.log(`Client disconnected (code: ${code}, reason: ${reason})`);
    });
  } catch (error) {
    console.error("Token verification failed:", error.message);
    socket.close(4002, "Token invalid");
  }
});

console.log("WebSocket server is running on ws://localhost:3000");
