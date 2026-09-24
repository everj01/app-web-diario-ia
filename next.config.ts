import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 es un módulo nativo: no se debe empaquetar
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
