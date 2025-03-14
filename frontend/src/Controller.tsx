import { useEffect, useState } from 'react';

export const Controller = () => {
    const [leftX, setLeftX] = useState(0);
    const [leftY, setLeftY] = useState(0);
    const [rightX, setRightX] = useState(0);
    const [rightY, setRightY] = useState(0);
    
    const [a, setA] = useState(false);
    const [b, setB] = useState(false);
    const [x, setX] = useState(false);
    const [y, setY] = useState(false);
    
    const [l1, setL1] = useState(false);
    const [l2, setL2] = useState(0);
    const [r1, setR1] = useState(false);
    const [r2, setR2] = useState(0);
    
    const DEADZONE = 0.1;
    let animationFrameId;

    const getDirection = (x, y) => {
        if (Math.abs(x) < DEADZONE && Math.abs(y) < DEADZONE) return 'Neutral';
        const angle = (Math.atan2(y, x) * 180) / Math.PI;
        if (angle >= -22.5 && angle < 22.5) return 'Right';
        if (angle >= 22.5 && angle < 67.5) return 'Down-Right';
        if (angle >= 67.5 && angle < 112.5) return 'Down';
        if (angle >= 112.5 && angle < 157.5) return 'Down-Left';
        if (angle >= 157.5 || angle < -157.5) return 'Left';
        if (angle >= -157.5 && angle < -112.5) return 'Up-Left';
        if (angle >= -112.5 && angle < -67.5) return 'Up';
        if (angle >= -67.5 && angle < -22.5) return 'Up-Right';
        return 'Neutral';
    };

    const updateGamepad = () => {
        const controller = navigator.getGamepads()[0];
        if (controller) {
            setLeftX(Math.abs(controller.axes[0]) > DEADZONE ? controller.axes[0] : 0);
            setLeftY(Math.abs(controller.axes[1]) > DEADZONE ? controller.axes[1] : 0);
            setRightX(Math.abs(controller.axes[2]) > DEADZONE ? controller.axes[2] : 0);
            setRightY(Math.abs(controller.axes[3]) > DEADZONE ? controller.axes[3] : 0);
            
            setA(controller.buttons[0].pressed);
            setB(controller.buttons[1].pressed);
            setX(controller.buttons[2].pressed);
            setY(controller.buttons[3].pressed);
            
            setL1(controller.buttons[4].pressed);
            setL2(controller.buttons[6]?.value || 0);
            setR1(controller.buttons[5].pressed);
            setR2(controller.buttons[7]?.value || 0);
        }
        animationFrameId = requestAnimationFrame(updateGamepad);
    };

    useEffect(() => {
        window.addEventListener('gamepadconnected', updateGamepad);
        window.addEventListener('gamepaddisconnected', () => cancelAnimationFrame(animationFrameId));
        updateGamepad();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('gamepadconnected', updateGamepad);
            window.removeEventListener('gamepaddisconnected', () => cancelAnimationFrame(animationFrameId));
        };
    }, []);

    return (
        <div className="flex flex-col items-center space-y-4">
            <h3>DualSense Controller</h3>
            <p>Left Stick: ({leftX.toFixed(2)}, {leftY.toFixed(2)}) - {getDirection(leftX, leftY)}</p>
            <p>Right Stick: ({rightX.toFixed(2)}, {rightY.toFixed(2)}) - {getDirection(rightX, rightY)}</p>
            <p>Buttons: A: {a ? 'Pressed' : 'Released'}, B: {b ? 'Pressed' : 'Released'}, X: {x ? 'Pressed' : 'Released'}, Y: {y ? 'Pressed' : 'Released'}</p>
            <p>L1: {l1 ? 'Pressed' : 'Released'}, L2: {l2.toFixed(2)}, R1: {r1 ? 'Pressed' : 'Released'}, R2: {r2.toFixed(2)}</p>
            <span className="grid grid-cols-3 gap-1 text-center w-32 h-32 border rounded-lg p-2">
                <div>{getDirection(leftX, leftY) === 'Up-Left' ? '⬉' : ''}</div>
                <div>{getDirection(leftX, leftY) === 'Up' ? '⬆' : ''}</div>
                <div>{getDirection(leftX, leftY) === 'Up-Right' ? '⬈' : ''}</div>
                <div>{getDirection(leftX, leftY) === 'Left' ? '⬅' : ''}</div>
      
                <div>{getDirection(leftX, leftY) === 'Right' ? '➡' : ''}</div>
                <div>{getDirection(leftX, leftY) === 'Down-Left' ? '⬋' : ''}</div>
                <div>{getDirection(leftX, leftY) === 'Down' ? '⬇' : ''}</div>
                <div>{getDirection(leftX, leftY) === 'Down-Right' ? '⬊' : ''}</div>
           
                <div>{getDirection(rightX, rightY) === 'Up-Left' ? '⬉' : ''}</div>
                <div>{getDirection(rightX, rightY) === 'Up' ? '⬆' : ''}</div>
                <div>{getDirection(rightX, rightY) === 'Up-Right' ? '⬈' : ''}</div>
                <div>{getDirection(rightX, rightY) === 'Left' ? '⬅' : ''}</div>

                <div>{getDirection(rightX, rightY) === 'Right' ? '➡' : ''}</div>
                <div>{getDirection(rightX, rightY) === 'Down-Left' ? '⬋' : ''}</div>
                <div>{getDirection(rightX, rightY) === 'Down' ? '⬇' : ''}</div>
                <div>{getDirection(rightX, rightY) === 'Down-Right' ? '⬊' : ''}</div>
            </span>
        </div>
    );
};
