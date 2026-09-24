import Database from "better-sqlite3"; // Libreria mas usada para sql lite
import fs from "fs"; // Para gestionar archivos y carpetas
import path from "path"; // Construir y manipular rutas de archivos

const dir = path.join(process.cwd(), "data");

fs.mkdirSync(dir, { recursive: true });

const g = globalThis as unknown as { db?: Database.Database };  // globalThis es el objeto global abosulto, maso maso

export const db = g.db ?? new Database(path.join(dir, "diario.db"));

if (process.env.NODE_ENV !== "production") g.db = db;

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON"); // en SQLite vienen apagadas por defecto

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS entries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day        TEXT NOT NULL,       -- 'YYYY-MM-DD' como texto, asi ordena solo y el mes sale con substr
    content    TEXT NOT NULL,
    mood       INTEGER,             -- 1..5, lo elige el usuario
    ai_mood    INTEGER,             -- 1..5, esto lo llena analyzeMood()
    ai_comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_entries_user_day ON entries(user_id, day);
`);

export type User = { id: number; name: string; email: string };

export type Entry = {
  id: number;
  day: string;
  content: string;
  mood: number | null;
  aiMood: number | null;
  aiComment: string | null;
  createdAt: string;
  updatedAt: string;
};

// alias para que el json salga camelCase y el front no traduzca nada.
// lo puse aca porque se repite en varias queries
export const ENTRY_COLUMNS = `
  id, day, content, mood,
  ai_mood AS aiMood, ai_comment AS aiComment,
  created_at AS createdAt, updated_at AS updatedAt
`;
