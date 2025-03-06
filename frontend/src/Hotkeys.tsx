import { useCallback, useEffect, useState } from "react";
import { useKeyPress } from "./hooks";
import io from "socket.io-client";

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
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(baseURL, { autoConnect: true });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

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
  const moveBackwardCommand = useKeyPress(
    commandKeyMappings.get("moveBackward")
  );
  const moveUpwardsCommand = useKeyPress(commandKeyMappings.get("moveUpwards"));
  const moveDownwardsCommand = useKeyPress(
    commandKeyMappings.get("moveDownwards")
  );
  const tiltLeftCommand = useKeyPress(commandKeyMappings.get("tiltLeft"));
  const tiltRightCommand = useKeyPress(commandKeyMappings.get("tiltRight"));
  const cameraPitchUpCommand = useKeyPress(
    commandKeyMappings.get("cameraPitchUp")
  );
  const cameraPitchDownCommand = useKeyPress(
    commandKeyMappings.get("cameraPitchDown")
  );
  const cameraYawLeftCommand = useKeyPress(
    commandKeyMappings.get("cameraYawLeft")
  );
  const cameraYawRightCommand = useKeyPress(
    commandKeyMappings.get("cameraYawRight")
  );
  const noteCommand = useKeyPress(commandKeyMappings.get("notes"));
  const helpCommand = useKeyPress(commandKeyMappings.get("help"));
  const toggleHotkeysCommand = useKeyPress(
    commandKeyMappings.get("toggleHotkeys")
  );

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
    },
    [emitHotkeySocket, isHotkeysEnabled]
  );

  useEffect(() => {
    if (toggleHotkeysCommand) {
      setIsHotkeysEnabled((prev) => !prev);
    }
  }, [toggleHotkeysCommand]);

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
      <label className="switch">
        <input
          type="checkbox"
          checked={isHotkeysEnabled}
          onChange={() => setIsHotkeysEnabled((prev) => !prev)}
        />
        <span className="slider round"></span>
      </label>
      <p>Hotkeys {isHotkeysEnabled ? "Enabled" : "Disabled"}</p>
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
          background-color: #ccc;
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
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #2196f3;
        }

        input:checked + .slider:before {
          transform: translateX(14px);
        }
      `}</style>
    </div>
  );
}

export default HotKeys;
