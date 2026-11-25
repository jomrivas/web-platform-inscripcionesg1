import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo desarrollo: permite abrir el servidor local desde otro equipo de
  // la red (p. ej. un teléfono). Sin esto, Next bloquea sus recursos de
  // desarrollo y la página carga sin JavaScript. No afecta producción.
  allowedDevOrigins: ['192.168.1.44'],
};

export default nextConfig;
