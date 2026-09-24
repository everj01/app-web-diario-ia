"use client";

import { useState } from "react";
import { MOODS } from "@/lib/moods";

type Props = {
  initialText?: string;
  initialMood?: number | null;
  submitLabel: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit: (text: string, mood: number | null) => Promise<void>;
  onCancel?: () => void;
};

export default function EntryEditor({
  initialText = "",
  initialMood = null,
  submitLabel,
  placeholder,
  autoFocus,
  onSubmit,
  onCancel,
}: Props) {
  const [text, setText] = useState(initialText);
  const [mood, setMood] = useState<number | null>(initialMood);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e?: React.SyntheticEvent) {
    e?.preventDefault();
    if (!text.trim()) {
      setError("Escribe algo antes de guardar.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(text.trim(), mood);
      if (!onCancel) {
        // es el de nota nueva, lo dejo limpio
        setText("");
        setMood(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="editor" onSubmit={save}>
      <textarea
        className="lined-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save(e);
          if (e.key === "Escape" && onCancel) onCancel();
        }}
        placeholder={placeholder}
        aria-label="Texto de la nota"
        autoFocus={autoFocus}
        rows={4}
      />

      <div className="editor-bar">
        <div className="moods" role="radiogroup" aria-label="¿Cómo te sientes?">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mood === m.value}
              className="mood-chip"
              onClick={() => setMood(mood === m.value ? null : m.value)}
            >
              <span className="dot" style={{ background: m.color }} />
              {m.label}
            </button>
          ))}
        </div>

        <div className="editor-actions">
          {onCancel && (
            <button type="button" className="link" onClick={onCancel}>
              Cancelar
            </button>
          )}
          <button className="btn" disabled={saving}>
            {saving ? "Guardando..." : submitLabel}
          </button>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
