import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { db, type User } from "./db";

// TODO: cuando esto se suba a un server de verdad, mejor tirar error si falta
// AUTH_SECRET en vez de usar el de desarrollo.
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "7g1MRe1i1wyeAyWKMDH2YwSwkrhmXFs"
);

export const SESSION_COOKIE = "diario_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function createToken(userId: number) {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

// la web manda cookie, flutter manda el header Bearer
export async function getUserId(): Promise<number | null> {
  const auth = (await headers()).get("authorization");
  const bearer = auth?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = bearer ?? (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return Number(payload.sub) || null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const id = await getUserId();
  if (!id) return null;
  const user = db
    .prepare("SELECT id, name, email FROM users WHERE id = ?")
    .get(id) as User | undefined;
  return user ?? null;
}

export function withSession(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, // asi el js de la pagina no lo puede leer
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  return res;
}

export function unauthorized() {
  return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
}
