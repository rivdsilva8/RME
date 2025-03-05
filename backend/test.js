import mavlink from 'mavlink';
import dgram from 'dgram';

const SITL_IP = '10.0.0.203';  // webserver - ip
const SITL_PORT = 14551;       // The port number for SITL communication

// Create a UDP socket to receive MAVLink messages
const client = dgram.createSocket('udp4');

client.on('listening', () => {
  const address = client.address();
  console.log(`UDP socket is listening on ${address.address}:${address.port}`);
});

client.on('message', (message, remote) => {
  console.log(`Received MAVLink message from ${remote.address}:${remote.port}`);
  
  // Log raw MAVLink message as buffer
  console.log('Raw MAVLink message (Buffer):', message);
  
  // Initialize MAVLink parser
  const mav = new mavlink();
  
  // Parse the incoming message
  try {
    mav.parse(message);
    console.log('Successfully parsed MAVLink message:', mav);
  } catch (err) {
    console.error('Error parsing MAVLink message:', err);
  }
});

// Handle errors
client.on('error', (err) => {
  console.error(`Error with UDP client: ${err.message}`);
  client.close();  // Close the socket on error
});

// Start listening on the specified IP and port
client.bind(SITL_PORT, SITL_IP, () => {
  console.log(`Started listening for MAVLink messages on ${SITL_IP}:${SITL_PORT}`);
});

// Optional: Log a message every time a message is received
client.on('message', (message) => {
  console.log('New message received');
});
