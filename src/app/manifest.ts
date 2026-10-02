import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ravenn",
    short_name: "Ravenn",
    description: "Agenda, clientes e financeiro para tatuadores",
    lang: "pt-BR",
    start_url: "/agenda",
    display: "standalone",
    orientation: "portrait",
    background_color: "#141414",
    theme_color: "#141414",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
