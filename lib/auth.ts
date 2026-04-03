import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const ADMIN_USER = (process.env.BCLB_ADMIN_USER ?? "admin").trim();
const ADMIN_PASS = (process.env.BCLB_ADMIN_PASS ?? "P@ssw0rd").trim();
const COOKIE_NAME = "admin_session";
const secret = new TextEncoder().encode(
  (process.env.BCLB_JWT_SECRET ?? "fallback-secret-change-in-production").trim()
);

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export function validateAdminCredentials(user: string, pass: string): boolean {
  return user === ADMIN_USER && pass === ADMIN_PASS;
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export { COOKIE_NAME };
