import sys
import time
import math
from flask import Flask
from flask_socketio import SocketIO, emit
from pymavlink import mavutil
import threading
from datetime import datetime

# Flask App Setup
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins=['http://localhost:5173'])

SITL_IP = "127.0.0.1"
SITL_PORT = 14550

mavlink_conn = None
current_yaw = 0  # Store the latest yaw (heading) of the drone

def initialize_mavlink_conn():
    global mavlink_conn
    if mavlink_conn is None:
        print("Establishing MAVLink connection...")
        mavlink_conn = mavutil.mavlink_connection(f'udp:{SITL_IP}:{SITL_PORT}')
        mavlink_conn.wait_heartbeat()
        print("Heartbeat received. Connection established.")
        sys.stdout.flush()

def send_velocity_command(vx, vy, vz):
    """
    Send a velocity command in the NED frame with optional yaw control.
    vx: forward/backward velocity (relative to heading).
    vy: left/right velocity.
    vz: up/down velocity.
    yaw_rate: angular velocity to turn the drone (positive = right, negative = left).
    """
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
    global current_yaw
    print("Starting telemetry listener...")
    sys.stdout.flush()

    while True:
        msg = mavlink_conn.recv_match(blocking=True)
        if not msg:
            continue

        output = {}

        if msg.get_type() == "GLOBAL_POSITION_INT":
            telemetry_data = {
                "latitude": msg.lat / 1e7,
                "longitude": msg.lon / 1e7,
                "altitude": msg.alt / 1000,
                "relative_altitude": msg.relative_alt / 1000,
                "vx": msg.vx / 100,
                "vy": msg.vy / 100,
                "vz": msg.vz / 100
            }
            output = {"type": "telemetry", "data": telemetry_data}
            sys.stdout.flush()

        elif msg.get_type() == "ATTITUDE":
            current_yaw = msg.yaw  # Store latest yaw (in radians)
            attitude_data = {"roll": msg.roll, "pitch": msg.pitch, "yaw": current_yaw}
            output = {"type": "attitude", "data": attitude_data}
            sys.stdout.flush()

        if output:
            socketio.emit('telemetry_data', output)

@app.route('/')
def index():
    return "Drone Control Flask Server is running."

# Track active movement commands
active_commands = {"LEFT": False, "RIGHT": False, "FORWARD": False, "BACKWARD": False, "UP": False, "DOWN": False}


    # Set initial movement values
dx = dy = dz = 0

def reset_movement():
    """
    Reset movement commands every second to prevent unintended continuous movement.
    """
    global active_commands, dx, dy, dz
    while True:
        time.sleep(2)  # Run every second
        active_commands = {key: False for key in active_commands}  # Reset commands
        dx = dy = dz = 0  # Reset movement values
        sys.stdout.flush()


@socketio.on('hotkeys')
def handle_hotkeys(drone, command):
    """
    Handle received key commands from frontend.
    """
    global current_yaw, dx, dy, dz  # Declare global so values persist

    print(f"Received command: {command} for drone: {drone}")
    sys.stdout.flush()

    # Update the command state
    if command in active_commands:
        active_commands[command] = True
    else:
        for key in active_commands:
            if key == command:
                active_commands[key] = False

    # Reset movement values before applying new ones
    dx = dy = dz = 0  

    # Calculate movement based on active commands
    if active_commands["LEFT"] and not active_commands["RIGHT"]:
        dy = -1  # Move left
    elif active_commands["RIGHT"] and not active_commands["LEFT"]:
        dy = 1  # Move right
    elif active_commands["RIGHT"] and active_commands["LEFT"]:
        dy = 0      

    if active_commands["FORWARD"] and not active_commands["BACKWARD"]:
        dx = 1  # Move forward
    elif active_commands["BACKWARD"] and not active_commands["FORWARD"]:
        dx = -1  # Move backward
    elif active_commands["BACKWARD"] and active_commands["FORWARD"]:
        dx = 0      

    if active_commands["UP"] and not active_commands["DOWN"]:
        dz = -1  # Move up
    elif active_commands["DOWN"] and not active_commands["UP"]:
        dz = 1  # Move down
    elif active_commands["UP"] and active_commands["DOWN"]:
        dz = 0        

    # # Convert movement to North-East frame
    # heading_rad = current_yaw  # Yaw is already in radians
    # forward_x = dx * math.cos(heading_rad) - dy * math.sin(heading_rad)
    # forward_y = dx * math.sin(heading_rad) + dy * math.cos(heading_rad)

    # # Normalize movement
    # norm = (forward_x**2 + forward_y**2 + dz**2) ** 0.5
    # if norm > 0:
    #     forward_x /= norm
    #     forward_y /= norm
    #     dz /= norm

    # Send velocity command with yaw control
    send_velocity_command(dx, dy, dz)

    # Respond to client
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    emit('command_response', {
        'status': 'success',
        'command': f"Command {command} executed for drone {drone}",
        'timestamp': timestamp
    })

# Start the reset thread
reset_thread = threading.Thread(target=reset_movement, daemon=True)
reset_thread.start()

@socketio.on('connect')
def handle_connect():
    print("Client connected.")
    sys.stdout.flush()

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected.")
    sys.stdout.flush()

if __name__ == "__main__":
    initialize_mavlink_conn()
    telemetry_thread = threading.Thread(target=get_telemetry)
    telemetry_thread.daemon = True
    telemetry_thread.start()
    # reset_thread = threading.Thread(target=reset_movement, daemon=True)
    # reset_thread.start()
    socketio.run(app, host="0.0.0.0", port=5001, debug=True, use_reloader=False)
