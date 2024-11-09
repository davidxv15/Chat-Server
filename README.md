# Chat-Server

Real-Time Chat Application Backend  
This repository contains the backend server for the Real-Time Chat Application. It is built with Node.js, Express, and MongoDB and uses WebSocket for real-time chat functionality.

## How the Backend Works

The backend handles:  
User Authentication: Register, login, and logout functionalities.  
Message Storage: Saves and retrieves messages per chat room in MongoDB.  
Real-Time Messaging: Manages WebSocket connections to enable live chat.  
Room Management: Supports room-based conversations and lists active users.  
CAPTCHA Verification: Protects the app from bot interactions at registration.

**Key Features**  
User Authentication: Secured by JWT, all users must log in to access chat rooms.  
Real-Time WebSocket Connections: Manages message flow and user presence in real time.  
Room-Specific Messaging: Each chat room functions independently, with messages stored and accessed per room.  
Inactivity Handling: Automatic logout and session cleanup for inactive users.  
CAPTCHA Integration: Adds security to registration by verifying CAPTCHA responses.

**Technologies Used**  
Backend:  
Node.js & Express.js: Frameworks for handling server-side logic and API requests.  
MongoDB & Mongoose: Stores user data, messages, and session information.  
WebSocket: Manages two-way communication for real-time messaging.  
Security:  
JWT: Used for secure user authentication and session management.  
Bcrypt: Ensures secure password hashing.  
reCAPTCHA: Verifies user registrations to prevent spam.

**How to Run Locally**

1. Clone the repository:  
   git clone https://github.com/davidxv15/Chat-Server.git  
   cd chat-app-backend
2. Install dependencies:  
   npm install
3. Environment Setup:  
   Create a .env file in the project root with the following variables:  
   MONGO_URI=your_mongodb_uri  
   JWT_SECRET=your_jwt_secret  
   PORT=3001  
   RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
4. Run the server:  
   node server.js  
   The server will start on http://localhost:3001.

WebSocket:  
ws://https://sheltered-ocean-88159-0aef28cb17ba.herokuapp.com/ws/ws?token=your-jwt-token: Endpoint for WebSocket connections.  
Deployment:  
The backend is deployed on Heroku. It connects to a MongoDB Atlas database and interfaces with the frontend on Netlify. You can access the app via the frontend at:

Frontend URL: https://capable-selkie-5113d6.netlify.app/

Security and CORS:  
CORS is configured to allow requests from:  
Local Development: http://localhost:3003
Production: The deployed Netlify frontend and backend URLs.  
Future Improvements:  
Enhanced User Status: Show live online/offline indicators for each user.  
Admin Room Management: Allow admins to create and manage rooms directly from the app.  
Performance Optimizations: Scale the app to handle more users and messages smoothly.  
Use Case:  
The backend of this project supports a lightweight, real-time chat system, ideal for workplace communication. It handles user management, session control, and ensures security through JWT authentication and CAPTCHA verification.
