import { NextResponse } from "next/server";
import { db, ENTRY_COLUMNS, type Entry } from "@/lib/db";
import { getUserId, unauthorized } from "@/lib/auth";
import { isValidMood } from "@/lib/moods";
import { analyzeMood } from "@/lib/analyze";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

// ?month=2026-09 devuelve el resumen para pintar el calendario, ?day=2026-09-19 las notas del dia
export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const params = new URL(req.url).searchParams;
  const month = params.get("month");
  const day = params.get("day");

  if (month && MONTH.test(month)) {
    // un dia puede tener varias notas -> promedio. el ai_mood le gana al del usuario
    const days = db
      .prepare(
        `SELECT day, COUNT(*) AS count,
                CAST(ROUND(AVG(COALESCE(ai_mood, mood))) AS INTEGER) AS mood
         FROM entries
         WHERE user_id = ? AND substr(day, 1, 7) = ?
         GROUP BY day`
      )
      .all(userId, month);
    return NextResponse.json({ days });
  }

  if (day && DAY.test(day)) {
    const entries = db
      .prepare(
        `SELECT ${ENTRY_COLUMNS} FROM entries
         WHERE user_id = ? AND day = ?
         ORDER BY created_at ASC, id ASC`
      )
      .all(userId, day);
    return NextResponse.json({ entries });
  }

  return bad("Indica ?month=AAAA-MM o ?day=AAAA-MM-DD.");
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const day = String(body.day ?? "");
  const content = String(body.content ?? "").trim();
  const mood = body.mood ?? null;

  if (!DAY.test(day)) return bad("Fecha inválida.");
  if (!content) return bad("Escribe algo antes de guardar.");
  if (!isValidMood(mood)) return bad("Ánimo inválido.");

  const info = db
    .prepare("INSERT INTO entries (user_id, day, content, mood) VALUES (?, ?, ?, ?)")
    .run(userId, day, content, mood);
  const id = Number(info.lastInsertRowid);

  const ai = await analyzeMood(content); // por ahora siempre null
  if (ai) {
    db.prepare("UPDATE entries SET ai_mood = ?, ai_comment = ? WHERE id = ?").run(ai.mood, ai.comment, id);
  }

  const entry = db.prepare(`SELECT ${ENTRY_COLUMNS} FROM entries WHERE id = ?`).get(id) as Entry;
  return NextResponse.json({ entry }, { status: 201 });
}
