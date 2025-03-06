from flask import Flask
from flask_socketio import SocketIO, emit
import time
from pymavlink import mavutil

# Flask App Setup
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins=['http://localhost:5173']) #Corrected line

SITL_IP = "127.0.0.1"  # Since SITL and Flask are running on the same machine
SITL_PORT = 14550

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

def send_velocity_command(vx, vy, vz):
    """
    Send a velocity command to the drone in the NED frame (North-East-Down).
    vx: forward/backward velocity (positive is forward).
    vy: left/right velocity (positive is right).
    vz: up/down velocity (positive is down).
    """
    mavlink_conn = get_mavlink_conn()  # Ensure connection is established

    # Send the velocity command (NED frame)
    mavlink_conn.mav.set_position_target_local_ned_send(
        0,                                  # Time_boot_ms (set to 0 for now)
        mavlink_conn.target_system,         # Target system ID
        mavlink_conn.target_component,      # Target component ID
        mavutil.mavlink.MAV_FRAME_LOCAL_NED, # Coordinate frame (local NED)
        0b0000111111000111,                 # Type mask (ignore position, only use velocity)
        0, 0, 0,                             # Position X, Y, Z (ignored)
        vx, vy, vz,                          # Velocity in X (N), Y (E), Z (D)
        0, 0, 0,                             # Acceleration (ignored)
        0, 0                                 # Yaw and yaw rate (ignored)
    )
    print(f"Sent velocity command: vx={vx}, vy={vy}, vz={vz}")

@app.route('/')
def index():
    return "Drone Control Flask Server is running."

@socketio.on('hotkeys')
def handle_hotkeys(drone, command):
    """
    Handle the received command from frontend (hotkeys).
    """
    print(f"Received command: {command} for drone: {drone}")

    # Map the received command to corresponding velocity values
    distance = 3
    movement_mapping = {
        "FORWARD": (distance, 0, 0),
        "BACKWARD": (-distance, 0, 0),
        "LEFT": (0, -distance, 0),
        "RIGHT": (0, distance, 0),
        "UP": (0, 0, -distance),
        "DOWN": (0, 0, distance)
    }

    if command in movement_mapping:
        send_velocity_command(*movement_mapping[command])
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