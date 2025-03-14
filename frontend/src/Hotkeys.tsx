import { useCallback, useEffect, useState } from "react";
import { useKeyPress } from "./hooks";
import io from "socket.io-client";
import { Controller } from "./Controller";
const baseURL = "http://localhost:5001";

export enum Command {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  UP = "UP",
  DOWN = "DOWN",
  FORWARD = "FORWARD",
  BACKWARD = "BACKWARD",
  CAMERA_PITCH_UP = "CAMERA_PITCH_UP",
  CAMERA_PITCH_DOWN = "CAMERA_PITCH_DOWN",
  CAMERA_YAW_LEFT = "CAMERA_YAW_LEFT",
  CAMERA_YAW_RIGHT = "CAMERA_YAW_RIGHT",
  NOTES = "NOTES",
  HELP = "HELP",
  TOGGLE_HOTKEYS = "TOGGLE_HOTKEYS",
}

function HotKeys() {
  const [isHotkeysEnabled, setIsHotkeysEnabled] = useState(true);
  const [keyPressed, setKeyPressed] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null); // To store telemetry data
  const [attitude, setAttitude] = useState<any>(null);
  const [commandStatus, setCommandStatus] = useState<any>([]); 

  useEffect(() => {
    const newSocket = io(baseURL, { autoConnect: true });
    setSocket(newSocket);

    // Listen for telemetry and attitude data
    newSocket.on("telemetry_data", (data: any) => {
      if (data.type === "telemetry") {
        setTelemetry(data.data); // Update telemetry data
      } else if (data.type === "attitude") {
        setAttitude(data.data); // Update attitude data
      }
    
    });

    // Listen for command status response
    newSocket.on("command_response", (data: any) => {
    console.log(data); // Log the incoming response
    setCommandStatus((prevStatus) => [
      ...prevStatus, // Spread the previous status
      { command: data.command, timestamp: new Date().toLocaleTimeString() }, // Add new entry
    ]);
  });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
  // This effect runs every time the commandStatus changes
  console.log("Updated commandStatus:", commandStatus);
}, [commandStatus]); 

  const SkydioMappings = new Map([
    ["moveForward", "w"],
    ["moveBackward", "s"],
    ["tiltLeft", "a"],
    ["tiltRight", "d"],
    ["moveUpwards", " "],
    ["moveDownwards", "Shift"],
    ["cameraPitchUp", "ArrowUp"],
    ["cameraPitchDown", "ArrowDown"],
    ["cameraYawLeft", "ArrowLeft"],
    ["cameraYawRight", "ArrowRight"],
    ["notes", "Tab"],
    ["help", "h"],
    ["toggleHotkeys", "Control+h"],
  ]);

  const commandKeyMappings = SkydioMappings;

  const moveForwardCommand = useKeyPress(commandKeyMappings.get("moveForward"));
  const moveBackwardCommand = useKeyPress(commandKeyMappings.get("moveBackward"));
  const moveUpwardsCommand = useKeyPress(commandKeyMappings.get("moveUpwards"));
  const moveDownwardsCommand = useKeyPress(commandKeyMappings.get("moveDownwards"));
  const tiltLeftCommand = useKeyPress(commandKeyMappings.get("tiltLeft"));
  const tiltRightCommand = useKeyPress(commandKeyMappings.get("tiltRight"));
  const cameraPitchUpCommand = useKeyPress(commandKeyMappings.get("cameraPitchUp"));
  const cameraPitchDownCommand = useKeyPress(commandKeyMappings.get("cameraPitchDown"));
  const cameraYawLeftCommand = useKeyPress(commandKeyMappings.get("cameraYawLeft"));
  const cameraYawRightCommand = useKeyPress(commandKeyMappings.get("cameraYawRight"));
  const noteCommand = useKeyPress(commandKeyMappings.get("notes"));
  const helpCommand = useKeyPress(commandKeyMappings.get("help"));
  const toggleHotkeysCommand = useKeyPress(commandKeyMappings.get("toggleHotkeys"));

  const emitHotkeySocket = useCallback(
    (command: any) => {
      if (!socket) return;
      const drone = "nsd25002";
      console.log({ command, drone });
      socket.emit("hotkeys", drone, command);
    },
    [socket]
  );

  const handleKeyPress = useCallback(
    (command: any) => {
      if (!isHotkeysEnabled && command !== Command.TOGGLE_HOTKEYS) return;
      emitHotkeySocket(command);
      const timestamp = new Date().toLocaleTimeString(); // Get current timestamp
      setCommandStatus((prevStatus) => [
        ...prevStatus,
        { command, timestamp }, // Store both command and timestamp
      ]);
    },
    [emitHotkeySocket, isHotkeysEnabled]
  );
  

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return; // Prevent duplicate events from holding the key
      setKeyPressed(true);
    };

    const handleKeyUp = () => {
      setKeyPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isHotkeysEnabled || keyPressed) return;

    if (tiltLeftCommand) handleKeyPress(Command.LEFT);
    else if (tiltRightCommand) handleKeyPress(Command.RIGHT);
    else if (moveUpwardsCommand) handleKeyPress(Command.UP);
    else if (moveDownwardsCommand) handleKeyPress(Command.DOWN);
    else if (cameraPitchUpCommand) handleKeyPress(Command.CAMERA_PITCH_UP);
    else if (cameraPitchDownCommand) handleKeyPress(Command.CAMERA_PITCH_DOWN);
    else if (cameraYawLeftCommand) handleKeyPress(Command.CAMERA_YAW_LEFT);
    else if (cameraYawRightCommand) handleKeyPress(Command.CAMERA_YAW_RIGHT);
    else if (moveForwardCommand) handleKeyPress(Command.FORWARD);
    else if (moveBackwardCommand) handleKeyPress(Command.BACKWARD);
    else if (noteCommand) handleKeyPress(Command.NOTES);
    else if (helpCommand) handleKeyPress(Command.HELP);
  }, [
    isHotkeysEnabled,
    keyPressed,
    handleKeyPress,
    tiltLeftCommand,
    tiltRightCommand,
    moveUpwardsCommand,
    moveDownwardsCommand,
    cameraPitchUpCommand,
    cameraPitchDownCommand,
    cameraYawLeftCommand,
    cameraYawRightCommand,
    moveForwardCommand,
    moveBackwardCommand,
    noteCommand,
    helpCommand,
  ]);

  return (
    <div>
   <div>
  <h4>Command Status</h4>
  <Controller/>
  <ul
    style={{
      width: "900px",
      fontFamily: "monospace",
      color: 'lightgreen',
      backgroundColor: "black",
      padding: "20px",
      listStyleType: "none", // Remove the default bullet points
      height: '300px',
      maxHeight: '350px',
      overflowY: 'auto', // Allows scrolling if the list exceeds the maximum height
    }}
  >
   {commandStatus.length > 0 ? (
  commandStatus.map((item, index) => {
    return (
      <li
        key={index}
        style={{
          padding: "5px",
          display: "flex",
          justifyContent: "space-between", // Space between the command text and timestamp
        }}
      >
        <span>{item?.command}</span>
        <span style={{ fontSize: "0.8em", color: "gray" }}>{item?.timestamp}</span>
      </li>
    );
  })
) : (
  <li>Waiting for command...</li>
)}
  </ul>
</div>


      <label className="switch">
        <input
          type="checkbox"
          checked={isHotkeysEnabled}
          onChange={() => setIsHotkeysEnabled((prev) => !prev)}
        />
        <span className="slider round"></span>
      </label>
      <p>Hotkeys {isHotkeysEnabled ? "Enabled" : "Disabled"}</p>

      {/* Telemetry Display Section */}
      <div>
        <h3>Telemetry & Attitude</h3>
        <textarea
          readOnly
          rows={12}
          style={{
            width: "900px",
            fontFamily: "monospace",
            color: 'lightgreen',
            backgroundColor: "black",
            padding: "10px",
            height: '100px'
          }}
          value={
            telemetry && attitude
              ? `Telemetry Data:\nLat: ${telemetry.latitude}, Lon: ${telemetry.longitude}, Alt: ${telemetry.altitude}m, Rel Alt: ${telemetry.relative_altitude}m, vx: ${telemetry.vx}m/s, vy: ${telemetry.vy}m/s, vz: ${telemetry.vz}m/s\n\nAttitude Data:\nRoll: ${attitude.roll} rad, Pitch: ${attitude.pitch} rad, Yaw: ${attitude.yaw} rad`
              : "Waiting for telemetry and attitude data..."
          }
        />
      </div>

      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 34px;
          height: 20px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #fff;
          transition: 0.4s;
          border-radius: 34px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: black;
          transition: 0.4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: rgb(255, 251, 0);
        }

        input:checked + .slider:before {
          transform: translateX(14px);
          background-color: black; /* Set the ball color to black */
        }
      `}</style>
    </div>
  );
}

export default HotKeys
