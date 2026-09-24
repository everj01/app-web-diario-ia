// Pendiente: conectar el modelo (probar con ollama local o alguna api gratis).
// Devuelve mood 1-5 y un comentario corto, o null si no hay nada.
// Mientras sea null el diario usa el mood que puso el usuario y ya.

export async function analyzeMood(
  _text: string
): Promise<{ mood: number; comment: string } | null> {
  return null;
}
