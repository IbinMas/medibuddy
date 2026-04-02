"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const IV_LENGTH = 16;
function getKey() {
    const key = process.env.FIELD_ENCRYPT_KEY;
    if (!key) {
        throw new Error('FIELD_ENCRYPT_KEY is not configured');
    }
    const buffer = Buffer.from(key, 'base64');
    if (buffer.length !== 32) {
        throw new Error('FIELD_ENCRYPT_KEY must be a 32-byte base64 value');
    }
    return buffer;
}
function encrypt(text) {
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}
function decrypt(text) {
    const [ivHex, encryptedHex] = text.split(':');
    if (!ivHex || !encryptedHex) {
        throw new Error('Invalid encrypted payload');
    }
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', getKey(), Buffer.from(ivHex, 'hex'));
    return Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, 'hex')),
        decipher.final(),
    ]).toString('utf8');
}
//# sourceMappingURL=encryption.js.map