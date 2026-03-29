import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;

function toBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, salt, digest] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !digest) {
    return false;
  }

  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const stored = Buffer.from(digest, "hex");

  if (stored.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(stored, derived);
}

export function safeCompare(a: string, b: string) {
  const left = toBuffer(a);
  const right = toBuffer(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}
