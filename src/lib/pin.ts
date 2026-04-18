import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;

export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(pin.normalize("NFKC"), salt, 32, SCRYPT_OPTS);
  return `s1:${salt.toString("hex")}:${key.toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "s1") return false;
  const salt = Buffer.from(parts[1], "hex");
  const want = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || want.length !== 32) return false;
  const key = scryptSync(pin.normalize("NFKC"), salt, 32, SCRYPT_OPTS);
  return want.length === key.length && timingSafeEqual(want, key);
}
