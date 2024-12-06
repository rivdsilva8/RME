"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCrcExtra = exports.x25crc = void 0;
/**
 * Calculate the CRC checksum of a packet.
 * The CRC algorithm is based on the following settings using the polycrc port to JavaScript:
 *
 * import { crc } from 'polycrc'
 * const x25crc = crc(16, 0x1021, 0, 0xffff, false)
 */
function x25crc(buffer, start = 0, trim = 0, magic = null) {
    let crc = 0xffff;
    const digest = (byte) => {
        let tmp = (byte & 0xff) ^ (crc & 0xff);
        tmp ^= tmp << 4;
        tmp &= 0xff;
        crc = (crc >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4);
        crc &= 0xffff;
    };
    for (let i = start; i < buffer.length - trim; i++) {
        digest(buffer[i]);
    }
    if (magic !== null) {
        digest(magic);
    }
    return crc;
}
exports.x25crc = x25crc;
function calculateCrcExtra(messageSourceName, fields) {
    fields = [...fields]
        .filter(field => !field.extension)
        .sort((f1, f2) => f2.fieldSize - f1.fieldSize);
    // See https://mavlink.io/en/guide/serialization.html#crc_extra for more information
    let buffer = Buffer.from(messageSourceName + ' ');
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        // the uint8_t_mavlink_version typ is actually uint8_t but spelled like that
        // to denote that it is read-only (crazy stuff)
        const fieldType = field.source.type === 'uint8_t_mavlink_version' ? 'uint8_t' : field.itemType;
        const fieldName = field.source.name;
        buffer = Buffer.concat([buffer, Buffer.from(`${fieldType} ${fieldName} `)]);
        if (field.arrayLength) {
            buffer = Buffer.concat([buffer, Buffer.from([field.arrayLength])]);
        }
    }
    const crc = x25crc(buffer);
    return (crc & 0xff) ^ (crc >> 8);
}
exports.calculateCrcExtra = calculateCrcExtra;
