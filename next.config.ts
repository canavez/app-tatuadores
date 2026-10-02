import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir o servidor de desenvolvimento pelo celular na rede Wi-Fi de casa
  // (npm run dev:celular). Só vale em desenvolvimento.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
