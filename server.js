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
// Keep track of clients in each room in object, for user list
const rooms = {};

// Function to broadcast the updated user list to all clients in the room
const broadcastUserList = (room) => {
  const updatedUserList = rooms[room] || [];

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN && client.room === room) {
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
    socket.user = { id: decoded.id, username: decoded.username || "Anonymous" };

    console.log("Client connected with user ID:", socket.user.id);

    socket.userRooms = [];  // tracks user's current room

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
        const room = messageData.room;

        // Add user to the room if not already present
        if (!rooms[room]) {
          rooms[room] = [];
        }

        if (!rooms[room].includes(socket.user.username)) {
          rooms[room].push(socket.user.username);
        }

        // Track the room the user joined
        if (!socket.userRooms.includes(room)) {
          socket.userRooms.push(room);
        }

        // Broadcast the updated user list
        broadcastUserList(room);
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
      if (currentRoom && rooms[currentRoom]) {
        // Remove user from room on disconnect
        rooms[currentRoom] = rooms[currentRoom].filter(
          (username) => username !== socket.user.username
        );

         // If the room is now empty, delete it
         if (rooms[currentRoom].length === 0) {
          delete rooms[currentRoom];
        }

        // Broadcast updated user list to remaining clients
        broadcastUserList(currentRoom);

        console.log(`${socket.user.username} disconnected from room: ${currentRoom}`);
      }
    });
  } catch (error) {
    console.error("Token verification failed:", error.message);
    socket.close(4002, "Token invalid");
  }
});

console.log("WebSocket server is running on ws://localhost:3000");
