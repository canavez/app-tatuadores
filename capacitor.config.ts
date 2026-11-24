import type { CapacitorConfig } from "@capacitor/cli";

// App de iPhone e de Android: uma "casca" nativa que abre o Ravenn publicado.
// Toda mudança que vai para a Vercel chega no app sem precisar de versão nova na loja;
// versão nova só quando mexer em coisa nativa (plugins, ícone, permissões).
const config: CapacitorConfig = {
  appId: "me.ravenn.app",
  appName: "Ravenn",
  // Página mostrada só se o site não abrir (sem internet).
  webDir: "app-nativo/www",
  server: {
    // Abre direto no app (sem login, cai no login). A página inicial, com o preço,
    // fica só para o site: a Apple não quer preço de fora dentro do app.
    url: "https://ravenn.me/hoje",
    // Links para outros sites (WhatsApp, Instagram) abrem fora do app.
    allowNavigation: ["ravenn.me"],
  },
  backgroundColor: "#0b0b12",
  ios: {
    // A página já cuida do notch e da barra inferior (env(safe-area-inset-*)).
    contentInset: "never",
    scheme: "Ravenn",
  },
  android: {
    // Mesmo fundo escuro enquanto a página carrega (sem piscar branco).
    backgroundColor: "#0b0b12",
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
    // Android: o app ocupa a tela toda e a página respeita as barras do sistema pelo
    // env(safe-area-inset-*), como no iPhone (viewport-fit=cover no layout).
    SystemBars: {
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
      style: "DARK",
    },
    LocalNotifications: {
      // Ícone branco da barra de notificações do Android (res/drawable-*/ic_stat_ravenn.png).
      smallIcon: "ic_stat_ravenn",
      iconColor: "#7f79b9",
    },
  },
};

export default config;
