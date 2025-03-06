import time
from pymavlink import mavutil

# SITL MAVLink Connection
SITL_IP = "10.0.0.203"  # IP address of the machine running SITL (Windows PC)
SITL_PORT = 14551       # MAVLink UDP port for SITL

# Connect to SITL
mavlink_conn = mavutil.mavlink_connection(f'udp:{SITL_IP}:{SITL_PORT}')

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

        # Sleep for a short time to avoid spamming the console
        # time.sleep(0.1)

if __name__ == "__main__":
    get_telemetry()
