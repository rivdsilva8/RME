import time
from pymavlink import mavutil

# SITL MAVLink Connection
SITL_IP = "10.0.0.203"  # IP address of the machine running SITL (Windows PC)
SITL_PORT = 14551       # MAVLink UDP port for SITL

# Connect to SITL
mavlink_conn = mavutil.mavlink_connection(f'udp:{SITL_IP}:{SITL_PORT}')
mavlink_conn.wait_heartbeat()
print("Heartbeat received. Connection established.")

# Function to change flight mode
def set_mode(mode):
    """
    Set the flight mode of the drone.
    """
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

    # Wait for confirmation
    while True:
        ack = mavlink_conn.recv_match(type='COMMAND_ACK', blocking=True)
        if ack and ack.command == mavutil.mavlink.MAV_CMD_DO_SET_MODE:
            print(f"Mode change to {mode} acknowledged.")
            return True

# Function to fetch telemetry data
def get_telemetry():
    print("Starting telemetry listener...")

    while True:
        # Receive message from SITL
        msg = mavlink_conn.recv_match(blocking=True)
        if not msg:
            continue

        # Initialize output variable
        output = ""

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
            output = f"Position -> Lat: {telemetry_data['latitude']:.7f}, Lon: {telemetry_data['longitude']:.7f}, MSL: {telemetry_data['altitude']:.2f}m, AGL: {telemetry_data['relative_altitude']:.2f}m, vx: {telemetry_data['vx']:.2f}m/s, vy: {telemetry_data['vy']:.2f}m/s, vz: {telemetry_data['vz']:.2f}m/s"

        # Handle ATTITUDE for attitude data
        elif msg.get_type() == "ATTITUDE":
            telemetry_data = {
                "roll": msg.roll,  # radians
                "pitch": msg.pitch,
                "yaw": msg.yaw
            }
            output = f"Attitude -> Roll: {telemetry_data['roll']:.2f}, Pitch: {telemetry_data['pitch']:.2f}, Yaw: {telemetry_data['yaw']:.2f}"

        # Print the output on a new line
        if output != '':
            print(output)

if __name__ == "__main__":
    # Set the drone mode to GUIDED
    # set_mode("RTL")
    
    # Start fetching telemetry data
    get_telemetry()
