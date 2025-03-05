import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import pkg from "node-mavlink";
import dgram from "dgram";

// Extract MavLink from the default import
const { MavLink } = pkg;

// Initialize MAVLink parser with correct message definitions
const mavlink = new MavLink({
  systemId: 1,
  componentId: 1,
  messageDefinitions: "./message_definitions/v1.0/common.xml", // Make sure this path is correct
});

// Set up UDP client
const udpClient = dgram.createSocket("udp4");
const remoteHost = "10.0.0.203"; // Replace with your target host
const remotePort = 14551; // Replace with the target port

// Define socket server
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"],
  },
});

// Handle sending commands through socket
function handleCommand(drone, command) {
  if (!command || typeof command !== "string") {
    console.log("Invalid command received:", command);
    return;
  }

  console.log(`Executing command: ${command}`);

  // Handle Left/Right movement (example)
  if (command === "LEFT" || command === "RIGHT") {
    const msg = new mavlink.messages.SetPositionTargetLocalNed();

    msg.time_boot_ms = Date.now();
    msg.target_system = 1;
    msg.target_component = 1;
    msg.coordinate_frame = mavlink.MAV_FRAME_LOCAL_NED;
    msg.vx = 0;
    msg.vy = command === "LEFT" ? -1.0 : 1.0; // Move left or right
    msg.vz = 0;
    msg.type_mask =
      mavlink.POSITION_TARGET_TYPEMASK.X_IGNORE |
      mavlink.POSITION_TARGET_TYPEMASK.Y_IGNORE |
      mavlink.POSITION_TARGET_TYPEMASK.Z_IGNORE |
      mavlink.POSITION_TARGET_TYPEMASK.ACCELERATION_IGNORE |
      mavlink.POSITION_TARGET_TYPEMASK.FORCE_IGNORE |
      mavlink.POSITION_TARGET_TYPEMASK.YAW_IGNORE |
      mavlink.POSITION_TARGET_TYPEMASK.YAW_RATE_IGNORE;

    // Serialize the message
    const buffer = msg.pack();

    // Send the message over UDP
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

// Set up socket connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("hotkeys", (drone, command) => {
    try {
      handleCommand(drone, command); // Handle the command
    } catch (error) {
      console.error("Error handling command:", error);
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
