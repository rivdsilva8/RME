import sys
import time
import math
from flask import Flask
from flask_socketio import SocketIO, emit
from pymavlink import mavutil
import threading
from datetime import datetime, timezone
import math
import copy
# from pytz import  timezone

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

def send_velocity_command(vx, vy, vz, magnitude):
    """
    Send a velocity command in the NED frame with optional yaw control.
    vx: forward/backward velocity (relative to heading).
    vy: left/right velocity.
    vz: up/down velocity.
    yaw_rate: angular velocity to turn the drone (positive = right, negative = left).
    """
   

     # Send the velocity command (BODY frame)
    mavlink_conn.mav.set_position_target_local_ned_send(
        0,                                  # Time_boot_ms (set to 0 for now)
        mavlink_conn.target_system,         # Target system ID
        mavlink_conn.target_component,      # Target component ID
        mavutil.mavlink.MAV_FRAME_BODY_OFFSET_NED, # Coordinate frame (local BODY)
        0b0000111111000111,                 # Type mask (ignore position, only use velocity)
        0, 0, 0,                             # Position X, Y, Z (ignored)
        vx * magnitude, vy * magnitude, vz * magnitude,                          # Velocity in X (N), Y (E), Z (D)
        0, 0, 0,                             # Acceleration (ignored)
        0, 0                                 # Yaw and yaw rate (ignored)
    )

# Track active movement commands
g_last_keypress_timestamps = {"LEFT": None, "RIGHT": None, "FORWARD": None, "BACKWARD": None, "UP": None, "DOWN": None}

# Set initial movement values
g_dv = [0, 0, 0]
g_dv_mutex = threading.Lock() 

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

def update_dv():
    global g_dv

    timeout_s = 0.5  # Adjust this timeout if needed

    timestamp = datetime.now(timezone.utc)
    tsnow = timestamp  # Now in UTC

    left_pressed     = g_last_keypress_timestamps["LEFT"]     is not None and (tsnow - g_last_keypress_timestamps["LEFT"]).total_seconds() < timeout_s
    right_pressed    = g_last_keypress_timestamps["RIGHT"]    is not None and (tsnow - g_last_keypress_timestamps["RIGHT"]).total_seconds() < timeout_s
    forward_pressed  = g_last_keypress_timestamps["FORWARD"]  is not None and (tsnow - g_last_keypress_timestamps["FORWARD"]).total_seconds() < timeout_s
    backward_pressed = g_last_keypress_timestamps["BACKWARD"] is not None and (tsnow - g_last_keypress_timestamps["BACKWARD"]).total_seconds() < timeout_s
    up_pressed       = g_last_keypress_timestamps["UP"]       is not None and (tsnow - g_last_keypress_timestamps["UP"]).total_seconds() < timeout_s
    down_pressed     = g_last_keypress_timestamps["DOWN"]     is not None and (tsnow - g_last_keypress_timestamps["DOWN"]).total_seconds() < timeout_s

    # Debug print
    print(f"Pressed States: LEFT={left_pressed}, RIGHT={right_pressed}, FORWARD={forward_pressed}, BACKWARD={backward_pressed}, UP={up_pressed}, DOWN={down_pressed}")

    # Calculate movement based on active commands
    vy = -1 if left_pressed else 1 if right_pressed else 0
    vx = 1 if forward_pressed else -1 if backward_pressed else 0
    vz = -1 if up_pressed else 1 if down_pressed else 0

    with g_dv_mutex:  # Lock to prevent race conditions
        g_dv = [vx, vy, vz]
        print(f"Updated movement vector: {g_dv}")

def update_dv_loop():
    """
    keep calling update dv
    """

    while True:

        update_dv()

        time.sleep(0.5)

def send_mav_command():
    """
    Reset inactive movement commands every 1.5 seconds to prevent unintended continuous movement.
    """
    global g_dv
    print("send_mav_command thread started")
    time_interval_s = 0.5
    magnitude = 1.0
    while True:

        update_dv()

        with g_dv_mutex:  # Lock to ensure thread safety
            [vx, vy, vz] = g_dv

        if vx != 0 or vy != 0 or vz != 0:
            norm = math.sqrt(vx*vx + vy*vy + vz*vz)
            if norm != 0:  # Avoid division by zero
                vx, vy, vz = vx / norm, vy / norm, vz / norm
                success = send_velocity_command(vx, vy, vz, magnitude=magnitude)  # Send the latest command

                # TODO: if success is not true, warn user
                print('send mav command failed')

                # long sleep after sending mavlink command
                time.sleep(time_interval_s)

        # short sleep cycles if not sending active commands
        time.sleep(0.5)     


@app.route('/')
def index():
    return "Drone Control Flask Server is running."



@socketio.on('hotkeyBES-BE')
def handle_hotkeys(payload):
    """
    Handle the received command from frontend (hotkeys).
    input: payload
    output: g_dv
    """

    global g_last_keypress_timestamps
    print("HOTKEY: Received command: %s for drone: [%s]" % (payload["command"], payload["drone"]))

    payload_local = copy.deepcopy(payload)

    # Generate a timestamp for when the command is received
    timestamp = datetime.utcnow().isoformat() + "Z"

    # Update the command state
    if payload_local["command"] in g_last_keypress_timestamps:
        tsk = datetime.fromisoformat(payload_local["dispatch_key_down_timestamp"].replace("Z", "+00:00"))  # time of key press
        g_last_keypress_timestamps[payload_local["command"]] = tsk 

    # return a receipt of command received
    response = payload_local
    response['receive_timestamp'] =  timestamp

    emit('hotkeyBE-BES', response)



@socketio.on('connect')
def handle_connect():
    print("Client connected.")
    sys.stdout.flush()

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected.")
    sys.stdout.flush()

# Set initial movement values
g_dv = [0, 0, 0]

if __name__ == "__main__":
    initialize_mavlink_conn()
    telemetry_thread = threading.Thread(target=get_telemetry)
    telemetry_thread.daemon = True
    send_mav_thread = threading.Thread(target=send_mav_command, daemon=True)
    send_mav_thread.start()
    telemetry_thread.start()
    update_dv_thread = threading.Thread(target=update_dv_loop, daemon=True)
    update_dv_thread.start()
   
    # reset_thread = threading.Thread(target=reset_movement, daemon=True)
    # reset_thread.start()
    socketio.run(app, host="0.0.0.0", port=5001, debug=True, use_reloader=False)
