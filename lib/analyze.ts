import { askClaudeJSON } from "./claude";

// ai_mood le gana al mood elegido por el usuario (ver COALESCE en app/api/entries/route.ts)
export async function analyzeMood(
  text: string
): Promise<{ mood: number; comment: string } | null> {
  const result = await askClaudeJSON<{ mood: number; comment: string }>(
    `Analizas notas de un diario personal en español. Respondes SOLO un JSON
     con esta forma: {"mood": número del 1 al 5, "comment": string}.
     mood: 1 muy mal, 2 mal, 3 normal, 4 bien, 5 muy bien, según el tono real
     del texto (no lo que el autor dice sentir si contradice lo que cuenta).
     comment: una frase breve (máximo 20 palabras), cálida y cercana, como la
     anotaría un amigo al margen. Nunca suena a chatbot ni da consejos aquí,
     solo valida lo que lee. Sin emojis.`,
    text
  );
  if (!result) return null;
  const mood = Math.round(result.mood);
  if (!Number.isInteger(mood) || mood < 1 || mood > 5) return null;
  if (typeof result.comment !== "string" || !result.comment.trim()) return null;
  return { mood, comment: result.comment.trim() };
}
