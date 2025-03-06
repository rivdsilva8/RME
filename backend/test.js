import dgram from 'dgram';
import pkg from 'node-mavlink';

const { MavLinkPacketSplitter, MavLinkPacketParser, MavLink2Packet } = pkg;

const SITL_IP = '10.0.0.226'; // SITL
const SITL_PORT_RECEIVE = 14551;
const SITL_PORT_SEND = 14550;
const LOCAL_IP = '10.0.0.203'; // webserver
const LOCAL_PORT_SEND = 14550;
const LOCAL_PORT_RECEIVE = 14551;

const server = dgram.createSocket('udp4');
const sendSocket = dgram.createSocket('udp4');

// Listening for incoming MAVLink messages
server.on('listening', () => {
    const address = server.address();
    console.log(`Listening for MAVLink on ${address.address}:${address.port}`);
});

// Handling incoming messages
server.on('message', (message, remote) => {
    const splitter = new MavLinkPacketSplitter();
    const parser = new MavLinkPacketParser();

    splitter.write(message);
    splitter.pipe(parser);

    parser.on('data', (packet) => {
        if (packet.header.msgid === 0) {  // System status (heartbeat message)
            const customMode = packet.payload.readUInt32LE(0);
            const type = packet.payload.readUInt8(4);
            const autopilot = packet.payload.readUInt8(5);
            const baseMode = packet.payload.readUInt8(6);
            const systemStatus = packet.payload.readUInt8(7);

            const isArmed = (baseMode & 0x80) !== 0;
            console.log(`Drone is ${isArmed ? 'ARMED' : 'DISARMED'}`);
        }
    });
});

// Bind the server to listen on the specified IP and port
server.bind(LOCAL_PORT_RECEIVE, LOCAL_IP);

// Bind the socket for sending data
sendSocket.bind(LOCAL_PORT_SEND, LOCAL_IP);

// Manually define COMMAND_LONG structure for MAVLink binary format
function createCommandLongPacket(command, param1, param2, param3, param4, param5, param6, param7, targetSystem, targetComponent) {
    // Allocate enough space for the header and 7 float parameters (4 bytes each)
    const buffer = Buffer.alloc(18 + 7 * 4);  // Header size (18 bytes) + 7 floats (4 bytes each)

    // Header (first 18 bytes)
    buffer.writeUInt8(targetSystem, 0);      // System ID
    buffer.writeUInt8(targetComponent, 1);   // Component ID
    buffer.writeUInt16LE(command, 2);        // Command (2 bytes)
    
    // Write the parameters as 4-byte floats
    buffer.writeFloatLE(param1, 4);  
    buffer.writeFloatLE(param2, 8);  
    buffer.writeFloatLE(param3, 12);  
    buffer.writeFloatLE(param4, 16);  
    buffer.writeFloatLE(param5, 20);  
    buffer.writeFloatLE(param6, 24);  
    buffer.writeFloatLE(param7, 28);  
    
    return buffer;
}

// Function to send a MAVLink command over UDP
function sendMavlinkCommand(command, param1, param2, param3, param4, param5, param6, param7, targetSystem, targetComponent) {
    const commandLong = createCommandLongPacket(command, param1, param2, param3, param4, param5, param6, param7, targetSystem, targetComponent);

    // MAVLink 2 packet header
    const header = Buffer.alloc(10);  // Length of header (fixed size for MAVLink 2)
    header.writeUInt8(254, 0);  // Start byte (MAVLink 2)
    header.writeUInt8(commandLong.length, 1);  // Length byte (this will be updated based on the payload size)
    header.writeUInt8(0, 2);    // Packet sequence number
    header.writeUInt8(1, 3);    // System ID
    header.writeUInt8(1, 4);    // Component ID

    // Write the packet into a complete MAVLink packet
    const packet = Buffer.concat([header, commandLong]);

    // Send the command via the UDP socket
    sendSocket.send(packet, SITL_PORT_SEND, SITL_IP, (err) => {
        if (err) {
            console.error('Error sending MAVLink command:', err);
        } else {
            console.log(`Sent MAVLink command ${command} to ${SITL_IP}:${SITL_PORT_SEND}`);
        }
    });
}

// Example: Send a command to arm the drone and set the throttle after 5 seconds
setTimeout(() => {
    const MAV_CMD_COMPONENT_ARM_DISARM = 400;
    const ARM_VALUE = 1;  // 1 means arm, 0 means disarm
    sendMavlinkCommand(MAV_CMD_COMPONENT_ARM_DISARM, ARM_VALUE, 0, 0, 0, 0, 0, 0, 1, 1);  // Target system 1, target component 1

    // Set throttle after arming
    const MAV_CMD_DO_SET_SERVO = 183;  // Set servo command
    const THROTTLE_CHANNEL = 3;  // Throttle typically uses channel 3
    const THROTTLE_VALUE = 2000;  // Adjust this value as needed (servo PWM, typically 1000-2000)
    sendMavlinkCommand(MAV_CMD_DO_SET_SERVO, THROTTLE_CHANNEL, THROTTLE_VALUE, 0, 0, 0, 0, 0, 1, 1);  // Target system 1, target component 1
}, 5000);
