import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCb);
export const digest = value => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) { const salt = randomBytes(16).toString('hex'); const key = await scrypt(password, salt, 64); return `scrypt$${salt}$${Buffer.from(key).toString('hex')}`; }
export async function verifyPassword(password, stored) { try { const [, salt, hex] = stored.split('$'); const expected = Buffer.from(hex, 'hex'); const actual = Buffer.from(await scrypt(password, salt, expected.length)); return expected.length === actual.length && timingSafeEqual(expected, actual); } catch { return false; } }
