const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("ws"); // my WebSocket lib import
const jwt = require("jsonwebtoken"); // Import JWT library
const authRoutes = require("./Routes/auth");
// const contentRoutes = require("./Routes/content")
const { protect } = require("./middleware/auth");
const axios = require("axios");

require("dotenv").config();
console.log("Space ID:", process.env.CONTENTFUL_SPACE_ID);
console.log("Access Token:", process.env.CONTENTFUL_ACCESS_TOKEN);

const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies

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
console.log("/api/auth routes initialized");

// app.use("/api/content", contentRoutes);
// console.log("/api/content routes initialized");
// Test route to ensure the server is running
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

app.post("/verify-captcha", async (req, res) => {
  const { token } = req.body;

  console.log("JWT Secret:", process.env.JWT_SECRET);

  if (!token) {
    return res.status(400).json({ message: "No CAPTCHA token provided" });
  }

  // Verify the token with recaptcha api.
  try {
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`;
    const response = await axios.post(verificationUrl);

    const { success } = response.data;

    if (success) {
      res.json({ message: "Verification successful" });
    } else {
      res.status(400).json({ message: "CAPTCHA verification failed" });
    }
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const server = app.listen(3001, () => {
  console.log("Server running on port 3001");
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

      if (messageData.type === "join") {
        const { room, username } = messageData;

        // Add user to the room if not already in it
        if (!rooms[room]) rooms[room] = [];
        if (!rooms[room].includes(username)) {
          rooms[room].push(username);
          broadcastUserList(room);
        }

        socket.userRooms.push(room);
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

    socket.on("close", () => {
      socket.userRooms.forEach((room) => {
        rooms[room] = rooms[room].filter(
          (user) => user !== socket.user.username
        );
        broadcastUserList(room);
      });
      console.log(`Client disconnected (ID: ${socket.user.id})`);
    });
  } catch (error) {
    console.error("Token verification failed:", error.message);
    socket.close(4002, "Token invalid");
  }
});

console.log("WebSocket server is running on ws://localhost:3001");
