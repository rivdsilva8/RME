"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipeable = void 0;
/**
 * Simple object cloning facility
 */
function clone(input) {
    return JSON.parse(JSON.stringify(input));
}
/**
 * Construction of Pipeable object
 */
function pipeable(input) {
    const result = clone(input);
    if (result.pipe) {
        throw new Error('Error: the given object is already pipeable');
    }
    const pipeableResult = result;
    pipeableResult.pipe = (transform) => pipeable(transform(result));
    return result;
}
exports.pipeable = pipeable;
