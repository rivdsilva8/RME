import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { MAVLink } from "node-mavlink";
import { set_position_target_local_ned as SetPositionTargetLocalNED } from "node-mavlink/messages/common/set-position-target-local-ned";

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow React client
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.send("Socket.IO and MAVLink SITL server is running!");
});

// MAVLink Initialization
const mavlink = new MAVLink(null, 255, 0); // System ID = 255, Component ID = 0
import net from "net";

// Connect to SITL (adjust host/port if needed)
const mavConnection = net.createConnection({ port: 5760, host: "127.0.0.1" }); // Default SITL TCP port

// Handle MAVLink connection and data parsing
mavConnection.on("data", (data) => {
  try {
    mavlink.parse(data);
  } catch (err) {
    console.error("Error parsing MAVLink data:", err);
  }
});

// WASD Control Parameters
let velocityX = 0; // Forward/Backward velocity
let velocityY = 0; // Left/Right velocity
const velocityZ = 0; // Fixed altitude
const velocityYaw = 0; // Fixed yaw

// Function to send SET_POSITION_TARGET_LOCAL_NED
const sendPositionTarget = () => {
  const command = new SetPositionTargetLocalNED({
    time_boot_ms: 0, // Timestamp (ignored by SITL)
    target_system: 1, // Target system (SITL)
    target_component: 1, // Target component
    coordinate_frame: 1, // MAV_FRAME_LOCAL_NED
    type_mask: 0b0000111111000111, // Ignore position and acceleration; use velocity only
    x: 0,
    y: 0,
    z: 0,
    vx: velocityX, // Velocity in X (NED forward/backward)
    vy: velocityY, // Velocity in Y (NED left/right)
    vz: velocityZ, // Velocity in Z (NED up/down)
    afx: 0,
    afy: 0,
    afz: 0,
    yaw: velocityYaw,
    yaw_rate: 0,
  });

  mavConnection.write(command.pack(mavlink));
};

// Periodically send velocity commands to SITL
setInterval(() => {
  sendPositionTarget();
}, 100); // Send every 100ms

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Listen for WASD commands from the client
  socket.on("control", (direction) => {
    switch (direction) {
      case "W":
        velocityX = 2; // Forward
        break;
      case "S":
        velocityX = -2; // Backward
        break;
      case "A":
        velocityY = -2; // Left
        break;
      case "D":
        velocityY = 2; // Right
        break;
      case "STOP":
        velocityX = 0;
        velocityY = 0;
        break;
      default:
        console.log("Unknown direction:", direction);
    }

    console.log("Updated velocity:", { velocityX, velocityY });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start the server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
