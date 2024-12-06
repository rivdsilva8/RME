import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow requests from React client
    methods: ["GET", "POST"],
  },
});

// Middleware (optional, for serving static files or APIs)
app.use(express.json());

// Example route (optional)
app.get("/", (req, res) => {
  res.send("Socket.IO server is running!");
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Listen for "hotkey" events
  socket.on("hotkey", (drone, command) => {
    console.log(`Hotkey received from ${drone.name}:`, command);

    // Optionally, broadcast the event to other clients
    socket.broadcast.emit("hotkey-pressed", { drone, command });
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start the server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
