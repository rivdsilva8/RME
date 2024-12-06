/* eslint-disable no-nested-ternary */
import { useCallback, useEffect, useRef, useState } from "react";
import { useKeyPress } from "./hooks";
const baseURL = "http://localhost:4000";
import io from "socket.io-client";
const socket = io(baseURL);
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
}
function HotKeys() {
  // redux

  // State
  const [isHotkeysEnabled, setIsHotkeysEnabled] = useState(true);

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
  ]);
  const commandKeyMappings = SkydioMappings;

  // custom hooks
  // Get key press states directly using command mappings
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

  const emitHotkeySocket = useCallback((command: any) => {
    // const drone = currentDrone;
    const drone = { name: "nsd25002" };
    socket.emit("hotkey", drone, command);
    console.log({ command, drone: drone });
  }, []);

  // Handle key press based on Command
  const handleKeyPress = useCallback(
    (command: Command) => {
      console.log("key pressed");
      if (!isHotkeysEnabled) return;
      emitHotkeySocket(command);
    },
    [emitHotkeySocket, isHotkeysEnabled]
  );
  useEffect(() => {
    if (!isHotkeysEnabled) return;
    if (tiltLeftCommand) handleKeyPress(Command.LEFT);
    if (tiltRightCommand) handleKeyPress(Command.RIGHT);
    if (moveUpwardsCommand) handleKeyPress(Command.UP);
    if (moveDownwardsCommand) handleKeyPress(Command.DOWN);
    if (cameraPitchUpCommand) handleKeyPress(Command.CAMERA_PITCH_UP);
    if (cameraPitchDownCommand) handleKeyPress(Command.CAMERA_PITCH_DOWN);
    if (cameraYawLeftCommand) handleKeyPress(Command.CAMERA_YAW_LEFT);
    if (cameraYawRightCommand) handleKeyPress(Command.CAMERA_YAW_RIGHT);
    if (moveForwardCommand) handleKeyPress(Command.FORWARD);
    if (moveBackwardCommand) handleKeyPress(Command.BACKWARD);
    if (noteCommand) handleKeyPress(Command.NOTES);
    if (helpCommand) handleKeyPress(Command.HELP);
  }, [
    isHotkeysEnabled,
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
  const handleFocusChange = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    console.log("activeElement", activeElement);

    // Check if the active element is an interactive element
    const isInteractiveElement =
      activeElement.matches(
        'input, textarea, button, select, [contenteditable="true"]'
      ) || activeElement.closest(".leaflet-container"); // Leaflet map container

    if (isInteractiveElement) {
      setIsHotkeysEnabled(false); // Disable hotkeys
    } else {
      setIsHotkeysEnabled(true); // Re-enable hotkeys
    }
  }, []);

  useEffect(() => {
    // Listen for focus changes
    document.addEventListener("focusin", handleFocusChange);
    document.addEventListener("focusout", handleFocusChange);

    return () => {
      // Clean up event listeners
      document.removeEventListener("focusin", handleFocusChange);
      document.removeEventListener("focusout", handleFocusChange);
    };
  }, [handleFocusChange]);

  return (
    <div>
      <div>
        {isHotkeysEnabled ? "Hotkeys are Active" : "Hotkeys are Inactive"}
        <div>
          <textarea />
        </div>
      </div>
    </div>
  );
}

export default HotKeys;
