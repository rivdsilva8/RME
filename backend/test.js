import dgram from 'dgram';
import { MavLinkPacketSplitter, MavLinkPacketParser } from 'node-mavlink';

const SITL_IP = '10.0.0.203'; // Listen on all interfaces
const SITL_PORT = 14551; // Common MAVLink UDP port

const server = dgram.createSocket('udp4');

server.on('listening', () => {
  const address = server.address();
  console.log(`Listening for MAVLink on ${address.address}:${address.port}`);
});

server.on('message', (message, remote) => {
//   console.log(`Received MAVLink message from ${remote.address}:${remote.port}`);

  // Process MAVLink packets
  const splitter = new MavLinkPacketSplitter();
  const parser = new MavLinkPacketParser();
  
  splitter.write(message);
  splitter.pipe(parser);
  
  parser.on('data', (packet) => {
    // console.log('Parsed MAVLink Packet:', packet);
  
    if (packet.header.msgid === 0) {  // HEARTBEAT message
      const customMode = packet.payload.readUInt32LE(0);
      const type = packet.payload.readUInt8(4);
      const autopilot = packet.payload.readUInt8(5);
      const baseMode = packet.payload.readUInt8(6);
      const systemStatus = packet.payload.readUInt8(7);
  
      console.log(`HEARTBEAT received: Type=${type}, Autopilot=${autopilot}, Mode=${customMode}, Base Mode=${baseMode}, Status=${systemStatus}`);
  
      const isArmed = (baseMode & 0x80) !== 0;  // Check if the 'ARMED' bit is set
      console.log(`Drone is ${isArmed ? 'ARMED' : 'DISARMED'}`);
    }
  });
  
});

server.bind(SITL_PORT, SITL_IP);
