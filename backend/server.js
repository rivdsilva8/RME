import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { MavEsp8266, common } from "node-mavlink";
import dgram from "dgram";

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

// UDP Setup
const udpClient = dgram.createSocket("udp4"); // Use UDP socket
const remoteHost = "10.0.0.226"; // Replace with the IP address of the windows SITL PC
const remotePort = 14550; // Replace with the UDP port used by MAVLink or your windows SITL PC

// Command Mapping
const keyBindings = {
  FORWARD: "MOVE_FORWARD",
  BACKWARD: "MOVE_BACKWARD",
  RIGHT: "STRAFE_LEFT",
  LEFT: "STRAFE_RIGHT",
  UP: "FLY_UP",
  DOWN: "FLY_DOWN",
  CAMERA_PITCH_UP: "PITCH_UP",
  CAMERA_PITCH_DOWN: "PITCH_DOWN",
  CAMERA_YAW_LEFT: "YAW_LEFT",
  CAMERA_YAW_RIGHT: "YAW_RIGHT",
};

// Handle drone commands and send MAVLink messages over UDP
function handleCommand(drone, command) {
  if (!command || typeof command !== "string") {
    console.log("Invalid command received:", command);
    return;
  }

  console.log(`Executing command: ${command}`);

  if (command === "LEFT" || command === "RIGHT") {
    const message = new common.SetPositionTargetLocalNed();
    message.timeBootMs = Date.now();
    message.targetSystem = 1;
    message.targetComponent = 1;
    message.coordinateFrame = common.MavFrame.LOCAL_NED;
    message.vx = 0;
    message.vy = command === "LEFT" ? -1.0 : 1.0;
    message.vz = 0;
    message.typeMask =
      common.PositionTargetTypemask.X_IGNORE |
      common.PositionTargetTypemask.Y_IGNORE |
      common.PositionTargetTypemask.Z_IGNORE |
      common.PositionTargetTypemask.ACCELERATION_IGNORE |
      common.PositionTargetTypemask.FORCE_IGNORE |
      common.PositionTargetTypemask.YAW_IGNORE |
      common.PositionTargetTypemask.YAW_RATE_IGNORE;

    // Manually serialize the message into a buffer (depending on how node-mavlink serializes messages)
    const buffer = Buffer.from(message);

    // Send the buffer over UDP
    udpClient.send(buffer, 0, buffer.length, remotePort, remoteHost, (err) => {
      if (err) {
        console.error("Error sending MAVLink message over UDP:", err);
      } else {
        console.log(`Sent ${command} command via MAVLink`);
      }
    });
  } else {
    console.log(`Unknown command: ${command}`);
  }
}

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("hotkeys", (drone, command) => {
    try {
      handleCommand(drone, command);
    } catch (error) {
      console.log(error);
    }
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
