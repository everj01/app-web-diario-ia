"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email, password } : { name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo continuar. Intenta otra vez.");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo continuar.");
      setLoading(false);
    }
  }

  const accion = isLogin ? "Entrar" : "Crear cuenta";
  const esperando = isLogin ? "Entrando..." : "Creando cuenta...";

  return (
    <main className="auth">
      <div className="sheet auth-sheet">
        <h1 className="auth-title">{isLogin ? "Abre tu diario" : "Empieza tu diario"}</h1>
        <p className="auth-sub">
          {isLogin ? "Entra con tu correo y contraseña." : "Solo necesitas un correo y una contraseña."}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <label className="field">
              <span>Nombre</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </label>
          )}
          <label className="field">
            <span>Correo</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
          </label>

          {error && <p className="error" role="alert">{error}</p>}

          <button className="btn wide" disabled={loading}>
            {loading ? esperando : accion}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? (
            <>¿Aún no tienes cuenta? <Link href="/registro">Crea una</Link></>
          ) : (
            <>¿Ya tienes cuenta? <Link href="/login">Entra aquí</Link></>
          )}
        </p>
      </div>
    </main>
  );
}
