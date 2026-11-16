import crypto from "crypto";

export function getMFASecret(): string {
  return (process.env.ADMIN_MFA_SECRET || "J6KB2XVGDRWL5HOZPXM6JCLYOQHLI5QV").trim();
}

function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");

  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export function generateTOTP(secret: string = getMFASecret(), timeOffsetSeconds: number = 0): string {
  if (!secret) return "";
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000) + timeOffsetSeconds;
  const time = Math.floor(epoch / 30);

  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(time));

  const hmac = crypto.createHmac("sha1", key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;

  return code.toString().padStart(6, "0");
}

/**
 * Verify a 6-digit authenticator code.
 * Checks a window of -30s, current, and +30s to allow for clock drift between phone and computer.
 */
export function verifyTOTP(token: string, secret: string = getMFASecret()): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleanToken)) return false;

  for (const delta of [-30, 0, 30]) {
    if (generateTOTP(secret, delta) === cleanToken) {
      return true;
    }
  }

  return false;
}

export function getOTPAuthURI(account: string = "Prakash Nathan Admin"): string {
  const secret = getMFASecret();
  const issuer = "Prakash Nathan";
  return `otpauth://totp/${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}
