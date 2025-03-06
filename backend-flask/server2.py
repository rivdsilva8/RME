from flask import Flask
from flask_socketio import SocketIO, emit
import time
from pymavlink import mavutil

# Flask App Setup
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# SITL MAVLink Connection Details
SITL_IP = "10.0.0.203"  # IP address of the machine running SITL (Windows PC)
SITL_PORT = 14551       # MAVLink UDP port for SITL

# MAVLink connection initialized once and reused
mavlink_conn = None  

def get_mavlink_conn():
    """
    Establish MAVLink connection only when needed and reuse it for subsequent commands.
    """
    global mavlink_conn
    if mavlink_conn is None:
        mavlink_conn = mavutil.mavlink_connection(f'udp:{SITL_IP}:{SITL_PORT}')
        mavlink_conn.wait_heartbeat()
        print("Heartbeat received. Connection established.")
    return mavlink_conn

def set_mode(mode):
    """
    Set the flight mode of the drone.
    """
    mavlink_conn = get_mavlink_conn()  # Ensure connection is established
    mode_mapping = mavlink_conn.mode_mapping()
    
    if mode not in mode_mapping:
        print(f"Mode {mode} is not available.")
        return False

    mode_id = mode_mapping[mode]

    # Send the command to set mode
    mavlink_conn.mav.set_mode_send(
        mavlink_conn.target_system,
        mavutil.mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED,
        mode_id
    )

    # Wait for acknowledgment without blocking
    ack = mavlink_conn.recv_match(type='COMMAND_ACK', blocking=False)
    if ack and ack.command == mavutil.mavlink.MAV_CMD_DO_SET_MODE:
        print(f"Mode change to {mode} acknowledged.")
        return True
    return False

@app.route('/')
def index():
    return "Drone Control Flask Server is running."

@socketio.on('hotkeys')
def handle_hotkeys(drone, command):
    """
    Handle the received command from frontend (hotkeys).
    """
    print(f"Received command: {command} for drone: {drone}")

    # Here you can add logic to process the received command, e.g., mapping commands to MAVLink
    success = False
    if command == "FORWARD":
        success = set_mode("GUIDED")  # Modify as needed
    elif command == "LEFT":
        success = set_mode("STABILIZE")  # Modify as needed
    elif command == "RIGHT":
        success = set_mode("RTL")  # Modify as needed
        
    # Send back a response to frontend
    if success:
        emit('command_response', {'status': 'success', 'message': f"Command {command} executed for drone {drone}"})
    else:
        emit('command_response', {'status': 'error', 'message': f"Failed to execute {command} for drone {drone}"})

@socketio.on('connect')
def handle_connect():
    print("Client connected.")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected.")

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5001, debug=True, use_reloader=False)
