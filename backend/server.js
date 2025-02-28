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
const remoteHost = "10.0.0.226"; // Replace with the IP address of the remote PC
const remotePort = 14550; // Replace with the UDP port used by MAVLink or your system

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
function handleCommand(command) {
  console.log(command);
  if (keyBindings[command]) {
    console.log(`Executing command: ${keyBindings[command]}`);

    // Create MAVLink message for the command
    const message = new common.CommandLong();
    message.command = keyBindings[command]; // Adjust the specific MAVLink command for your case
    message.targetSystem = 1; // Adjust for your system ID
    message.targetComponent = 1; // Adjust for your component ID

    // Convert the MAVLink message to a buffer and send it via UDP
    const buffer = message.pack();
    udpClient.send(buffer, 0, buffer.length, remotePort, remoteHost, (err) => {
      if (err) {
        console.error("Error sending MAVLink message over UDP:", err);
      } else {
        console.log("MAVLink message sent successfully over UDP");
      }
    });
  } else {
    console.log(`Unknown command: ${command}`);
  }
}

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("hotkeys", (command) => {
    handleCommand(command);
    console.log("passed handleCommand");
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
