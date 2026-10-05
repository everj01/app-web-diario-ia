import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId, unauthorized } from "@/lib/auth";
import { askClaudeJSON } from "@/lib/claude";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

type Row = { day: string; content: string; mood: number | null; aiMood: number | null };

// si el día está vacío, usa las últimas notas para no dejar el panel sin nada
export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const day = new URL(req.url).searchParams.get("day") ?? "";
  if (!DAY.test(day)) return NextResponse.json({ error: "Indica ?day=AAAA-MM-DD." }, { status: 400 });

  let rows = db
    .prepare(
      `SELECT day, content, mood, ai_mood AS aiMood FROM entries
       WHERE user_id = ? AND day = ? ORDER BY created_at ASC`
    )
    .all(userId, day) as Row[];

  let basedOn: "day" | "recent" = "day";
  if (rows.length === 0) {
    rows = db
      .prepare(
        `SELECT day, content, mood, ai_mood AS aiMood FROM entries
         WHERE user_id = ? AND day <= ? ORDER BY day DESC, created_at DESC LIMIT 5`
      )
      .all(userId, day) as Row[];
    basedOn = "recent";
  }

  if (rows.length === 0) {
    return NextResponse.json({ advice: null, basedOn: null });
  }

  const texto = rows
    .map((r) => `(${r.day}, ánimo ${r.aiMood ?? r.mood ?? "sin marcar"}) ${r.content}`)
    .join("\n---\n");

  const result = await askClaudeJSON<{ advice: string }>(
    `Eres un acompañante cálido y breve para quien escribe un diario personal
     en español. Te paso una o varias notas suyas. Respondes SOLO un JSON con
     esta forma: {"advice": string}.
     advice: entre 2 y 4 frases, en segunda persona, tono cercano (no clínico,
     no genérico de autoayuda). Si el ánimo que se nota es bajo, prioriza
     contención y UNA sugerencia pequeña y concreta para hoy, no un sermón. Si
     el ánimo es bueno, celebra algo específico de lo que escribió. Nunca
     inventes datos que no estén en el texto. Sin emojis, sin encabezados.`,
    texto
  );

  if (!result || typeof result.advice !== "string" || !result.advice.trim()) {
    return NextResponse.json({ advice: null, basedOn: null });
  }

  return NextResponse.json({ advice: result.advice.trim(), basedOn });
}
