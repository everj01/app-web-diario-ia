import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createToken, withSession } from "@/lib/auth";

type Row = { id: number; name: string; email: string; password_hash: string };

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const row = db
    .prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?")
    .get(email) as Row | undefined;

  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  const user = { id: row.id, name: row.name, email: row.email };
  const token = await createToken(user.id);
  return withSession(NextResponse.json({ user, token }), token);
}
