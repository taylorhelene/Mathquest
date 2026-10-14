import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { usersCollection, UserDoc } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "math-quest-dev-secret-change-me",
);
const COOKIE_NAME = "mq_token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: {
  id: string;
  email: string;
  role?: string;
}): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role || "learner",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string,
): Promise<{ sub: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      role: String(payload.role || "learner"),
    };
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<{
  userId: string;
  email: string;
  role: string;
} | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

export async function getCurrentUser(): Promise<UserDoc | null> {
  const session = await getSession();
  if (!session) return null;
  try {
    const users = await usersCollection();
    const { ObjectId } = await import("mongodb");
    const user = await users.findOne({ _id: new ObjectId(session.userId) as any });
    return user;
  } catch {
    return null;
  }
}
