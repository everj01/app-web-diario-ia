import { NextResponse } from "next/server";
import { db, ENTRY_COLUMNS, type Entry } from "@/lib/db";
import { getUserId, unauthorized } from "@/lib/auth";
import { isValidMood } from "@/lib/moods";
import { analyzeMood } from "@/lib/analyze";

type Ctx = { params: Promise<{ id: string }> };

function notFound() {
  return NextResponse.json({ error: "No encontramos esa nota." }, { status: 404 });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const id = Number((await params).id);

  const body = await req.json().catch(() => ({}));
  const content = String(body.content ?? "").trim();
  const mood = body.mood ?? null;
  if (!content) return NextResponse.json({ error: "La nota no puede quedar vacía." }, { status: 400 });
  if (!isValidMood(mood)) return NextResponse.json({ error: "Ánimo inválido." }, { status: 400 });

  // el AND user_id es lo que evita que edites la nota de otro (no cambia filas -> 404)
  const info = db
    .prepare(
      `UPDATE entries SET content = ?, mood = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    )
    .run(content, mood, id, userId);
  if (info.changes === 0) return notFound();

  const ai = await analyzeMood(content);
  if (ai) {
    db.prepare("UPDATE entries SET ai_mood = ?, ai_comment = ? WHERE id = ?").run(ai.mood, ai.comment, id);
  }

  const entry = db.prepare(`SELECT ${ENTRY_COLUMNS} FROM entries WHERE id = ?`).get(id) as Entry;
  return NextResponse.json({ entry });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const id = Number((await params).id);

  const info = db.prepare("DELETE FROM entries WHERE id = ? AND user_id = ?").run(id, userId);
  if (info.changes === 0) return notFound();
  return NextResponse.json({ ok: true });
}
