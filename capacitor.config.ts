import type { CapacitorConfig } from "@capacitor/cli";

// App de iPhone (e, depois, Android): uma "casca" nativa que abre o Ravenn publicado.
// Toda mudança que vai para a Vercel chega no app sem precisar de versão nova na loja;
// versão nova só quando mexer em coisa nativa (plugins, ícone, permissões).
const config: CapacitorConfig = {
  appId: "me.ravenn.app",
  appName: "Ravenn",
  // Página mostrada só se o site não abrir (sem internet).
  webDir: "app-nativo/www",
  server: {
    url: "https://ravenn.me",
    // Links para outros sites (WhatsApp, Instagram) abrem fora do app.
    allowNavigation: ["ravenn.me"],
  },
  backgroundColor: "#0b0b12",
  ios: {
    // A página já cuida do notch e da barra inferior (env(safe-area-inset-*)).
    contentInset: "never",
    scheme: "Ravenn",
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#0b0b12",
      launchShowDuration: 600,
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK", // texto claro sobre o fundo escuro do app
      backgroundColor: "#0b0b12",
    },
  },
};

export default config;
