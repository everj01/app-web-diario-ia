"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import EntryEditor from "./EntryEditor";
import { MOODS, findMood } from "@/lib/moods";
import { MONTHS, WEEKDAYS, fromKey, longDate, monthKey, timeOf, toKey } from "@/lib/dates";

type User = { id: number; name: string; email: string };
type Entry = {
  id: number;
  day: string;
  content: string;
  mood: number | null;
  aiMood: number | null;
  aiComment: string | null;
  createdAt: string;
  updatedAt: string;
};
type DaySummary = { day: string; count: number; mood: number | null };

// para no repetir el headers y el try/catch en cada llamada
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Tu sesión terminó. Vuelve a entrar.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Algo falló. Intenta otra vez.");
  return data as T;
}

const UN_DIA = 1000 * 60 * 60 * 24;

function relativeDay(key: string, today: string) {
  const diff = Math.round((fromKey(today).getTime() - fromKey(key).getTime()) / UN_DIA);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 0) return "Un día que todavía no llega";
  return `Hace ${diff} días`;
}

export default function Diary({ user }: { user: User }) {
  // las fechas salen de la zona horaria del navegador, asi que no pinto nada hasta montar
  // (si no react reclama que el html del server no coincide)
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const [today] = useState(() => toKey(new Date()));
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [summary, setSummary] = useState<Record<string, DaySummary>>({});
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingDay, setLoadingDay] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");

  const loadMonth = useCallback(async () => {
    try {
      const data = await api<{ days: DaySummary[] }>(`/api/entries?month=${monthKey(month)}`);
      setSummary(Object.fromEntries(data.days.map((d) => [d.day, d])));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar el mes.");
    }
  }, [month]);

  const loadDay = useCallback(async () => {
    setLoadingDay(true);
    try {
      const data = await api<{ entries: Entry[] }>(`/api/entries?day=${selected}`);
      setEntries(data.entries);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar el día.");
    } finally {
      setLoadingDay(false);
    }
  }, [selected]);

  useEffect(() => { loadMonth(); }, [loadMonth]);
  useEffect(() => { loadDay(); setEditingId(null); }, [loadDay]);

  // primero los huecos hasta el dia 1 y despues los dias
  const cells = useMemo(() => {
    const offset = (month.getDay() + 6) % 7; // getDay() da 0=domingo, con +6 %7 el lunes queda 0
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); // dia 0 del mes que viene
    const list: (string | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= total; d++) {
      list.push(toKey(new Date(month.getFullYear(), month.getMonth(), d)));
    }
    return list;
  }, [month]);

  const daysWritten = Object.keys(summary).length;

  function shiftMonth(delta: number) {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  function goToday() {
    const d = new Date();
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(today);
  }

  async function createEntry(content: string, mood: number | null) {
    const { entry } = await api<{ entry: Entry }>("/api/entries", {
      method: "POST",
      body: JSON.stringify({ day: selected, content, mood }),
    });
    setEntries((list) => [...list, entry]);
    loadMonth(); // el color del dia pudo cambiar
  }

  async function updateEntry(id: number, content: string, mood: number | null) {
    const { entry } = await api<{ entry: Entry }>(`/api/entries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content, mood }),
    });
    setEntries((list) => list.map((e) => (e.id === id ? entry : e)));
    setEditingId(null);
    loadMonth();
  }

  async function deleteEntry(id: number) {
    if (!confirm("¿Borrar esta nota? No se puede recuperar.")) return;
    try {
      await api(`/api/entries/${id}`, { method: "DELETE" });
      setEntries((list) => list.filter((e) => e.id !== id));
      loadMonth();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo borrar.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (!ready) return <div className="app" aria-busy="true" />;

  const firstName = user.name.split(" ")[0];
  const isFuture = selected > today;

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">Diario de {firstName}</h1>
        <button className="link" onClick={logout}>Cerrar sesión</button>
      </header>

      <div className="layout">
        <aside className="calendar" aria-label="Calendario">
          <div className="cal-head">
            <button className="cal-nav" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">‹</button>
            <h2 className="cal-title">
              {MONTHS[month.getMonth()]} {month.getFullYear()}
            </h2>
            <button className="cal-nav" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">›</button>
          </div>

          <div className="cal-grid">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="cal-wd" aria-hidden="true">{w}</span>
            ))}
            {cells.map((key, i) => {
              if (!key) return <span key={`e${i}`} />;
              const info = summary[key];
              const mood = findMood(info?.mood);
              const classes = ["cal-day"];
              if (key === today) classes.push("is-today");
              if (key === selected) classes.push("is-selected");
              return (
                <button
                  key={key}
                  className={classes.join(" ")}
                  style={mood ? { background: mood.color } : undefined}
                  onClick={() => setSelected(key)}
                  aria-pressed={key === selected}
                  aria-label={`${longDate(key)}${info ? `, ${info.count} nota${info.count > 1 ? "s" : ""}` : ""}`}
                >
                  {fromKey(key).getDate()}
                  {info && !mood && <span className="has-notes" />}
                </button>
              );
            })}
          </div>

          <div className="cal-foot">
            <span>
              {daysWritten === 0
                ? "Este mes aún no escribes."
                : `Escribiste ${daysWritten} ${daysWritten === 1 ? "día" : "días"} este mes.`}
            </span>
            {selected !== today && (
              <button className="link" onClick={goToday}>Ir a hoy</button>
            )}
          </div>

          <ul className="legend" aria-label="Colores del ánimo">
            {MOODS.map((m) => (
              <li key={m.value}>
                <span className="dot" style={{ background: m.color }} /> {m.label}
              </li>
            ))}
          </ul>
        </aside>

        <section className="sheet page" aria-live="polite">
          <h2 className="day-title"><span>{longDate(selected)}</span></h2>
          <p className="day-meta">
            {relativeDay(selected, today)}
          </p>

          {!isFuture && (
            <EntryEditor
              key={selected} // con esto react reinicia el editor al cambiar de dia
              submitLabel="Guardar nota"
              placeholder={
                entries.length ? "Algo más que quieras apuntar..." : "¿Qué pasó hoy? ¿Cómo te sentiste?"
              }
              onSubmit={createEntry}
            />
          )}

          {loadError && <p className="error">{loadError}</p>}

          {loadingDay ? (
            <p className="muted">Cargando...</p>
          ) : entries.length === 0 ? (
            <p className="empty">
              {isFuture ? "Cuando llegue este día podrás escribir aquí." : "Todavía no hay notas este día."}
            </p>
          ) : (
            <div className="notes">
              {entries.map((e) => {
                const m = findMood(e.aiMood ?? e.mood);
                return (
                  <article key={e.id} className="note">
                    {editingId === e.id ? (
                      <EntryEditor
                        initialText={e.content}
                        initialMood={e.mood}
                        submitLabel="Guardar cambios"
                        autoFocus
                        onSubmit={(t, md) => updateEntry(e.id, t, md)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <>
                        <header className="note-head">
                          <time dateTime={e.createdAt}>{timeOf(e.createdAt)}</time>
                          {m && (
                            <span className="note-mood">
                              <span className="dot" style={{ background: m.color }} />
                              {m.label}
                            </span>
                          )}
                          <span className="note-actions">
                            <button className="link" onClick={() => setEditingId(e.id)}>Editar</button>
                            <button className="link danger" onClick={() => deleteEntry(e.id)}>Borrar</button>
                          </span>
                        </header>
                        <p className="lined-text note-body">{e.content}</p>
                        {e.aiComment && <p className="ai-note">{e.aiComment}</p>}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
