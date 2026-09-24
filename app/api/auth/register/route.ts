import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createToken, withSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Completa nombre, correo y contraseña." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Ese correo no parece válido." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }

  const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (exists) {
    return NextResponse.json({ error: "Ese correo ya tiene una cuenta." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  const info = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, hash);

  const user = { id: Number(info.lastInsertRowid), name, email };
  const token = await createToken(user.id);
  return withSession(NextResponse.json({ user, token }, { status: 201 }), token);
}
