import sys
import time
from flask import Flask
from flask_socketio import SocketIO, emit
from pymavlink import mavutil
import threading
from datetime import datetime

# Flask App Setup
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins=['http://localhost:5173'])

SITL_IP = "127.0.0.1"  # Since SITL and Flask are running on the same machine
SITL_PORT = 14550

# MAVLink connection initialized once and reused
mavlink_conn = None

def initialize_mavlink_conn():
    """
    Initialize the MAVLink connection once at the start.
    """
    global mavlink_conn
    if mavlink_conn is None:
        print("Establishing MAVLink connection...")
        mavlink_conn = mavutil.mavlink_connection(f'udp:{SITL_IP}:{SITL_PORT}')
        mavlink_conn.wait_heartbeat()
        print("Heartbeat received. Connection established.")
        sys.stdout.flush()  # Ensure output is printed immediately

def send_velocity_command(vx, vy, vz):
    """
    Send a velocity command to the drone in the NED frame (North-East-Down).
    vx: forward/backward velocity (positive is forward).
    vy: left/right velocity (positive is right).
    vz: up/down velocity (positive is down).
    """
    # Ensure MAVLink connection is established
    initialize_mavlink_conn()

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
    sys.stdout.flush()  # Ensure output is printed immediately

def get_telemetry():
    print("Starting telemetry listener...")
    sys.stdout.flush()  # Ensure output is printed immediately
    while True:
        # Receive message from SITL
        msg = mavlink_conn.recv_match(blocking=True)
        if not msg:
            continue

        # Initialize output variable
        output = {}

        # Handle GLOBAL_POSITION_INT for position data
        if msg.get_type() == "GLOBAL_POSITION_INT":
            telemetry_data = {
                "latitude": msg.lat / 1e7,  # Convert to degrees
                "longitude": msg.lon / 1e7,  # Convert to degrees
                "altitude": msg.alt / 1000,  # Convert mm to meters
                "relative_altitude": msg.relative_alt / 1000,  # Convert mm to meters
                "vx": msg.vx / 100,  # Convert cm/s to m/s
                "vy": msg.vy / 100,
                "vz": msg.vz / 100
            }
            output = {
                "type": "telemetry",  # Add the type of data
                "data": telemetry_data
            }
            # print(f"Telemetry Data: {output}")  # Log telemetry data
            sys.stdout.flush()  # Ensure output is printed immediately
        # Handle ATTITUDE for attitude data
        elif msg.get_type() == "ATTITUDE":
            attitude_data = {
                "roll": msg.roll,  # radians
                "pitch": msg.pitch,
                "yaw": msg.yaw
            }
            output = {
                "type": "attitude",  # Add the type of data
                "data": attitude_data
            }
            # print(f"Attitude Data: {output}")  # Log attitude data
            sys.stdout.flush()  # Ensure output is printed immediately

        # If telemetry or attitude data is available, emit it to the frontend
        if output:
            socketio.emit('telemetry_data', output)

@app.route('/')
def index():
    return "Drone Control Flask Server is running."

@socketio.on('hotkeys')
def handle_hotkeys(drone, command):
    """
    Handle the received command from frontend (hotkeys).
    """
    print(f"Received command: {command} for drone: {drone}")
    sys.stdout.flush()  # Ensure output is printed immediately

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
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    if command in movement_mapping:
        time.sleep(0.5)
        send_velocity_command(*movement_mapping[command])

        emit('command_response', {'status': 'success', 
                               'command': f"Command {command} executed for drone {drone}",
                               'timestamp': timestamp})
    else:
        error_message = f"Failed to execute command (invalid or undefined command) for drone {drone}"

        emit('command_response', {'status': 'error', 'command': error_message, 'timestamp': timestamp})


@socketio.on('connect')
def handle_connect():
    print("Client connected.")
    sys.stdout.flush()  # Ensure output is printed immediately

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected.")
    sys.stdout.flush()  # Ensure output is printed immediately

if __name__ == "__main__":

    initialize_mavlink_conn()  # Initialize MAVLink connection at the start

    telemetry_thread = threading.Thread(target=get_telemetry)
    telemetry_thread.daemon = True
    telemetry_thread.start()
    socketio.run(app, host="0.0.0.0", port=5001, debug=True, use_reloader=False)
