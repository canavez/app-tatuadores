// Coisas que o navegador faz sozinho mas que, dentro do app de Android (WebView), precisam
// de ajuda nativa: imprimir/salvar PDF, salvar imagem e compartilhar. No site e no iPhone
// continua tudo como antes (window.print, download e navigator.share).

async function capacitor() {
  const { Capacitor, registerPlugin } = await import("@capacitor/core");
  return { android: Capacitor.getPlatform() === "android", Capacitor, registerPlugin };
}

/** Abre a impressão (de onde se salva o PDF). */
export async function imprimir(titulo = "Ravenn") {
  try {
    const { android, Capacitor, registerPlugin } = await capacitor();
    if (android && Capacitor.isPluginAvailable("Impressao")) {
      const Impressao = registerPlugin<{ imprimir(opcoes: { titulo: string }): Promise<void> }>("Impressao");
      await Impressao.imprimir({ titulo });
      return;
    }
  } catch {
    // Sem o plugin: tenta a impressão do navegador.
  }
  window.print();
}

/** Estamos no app de Android? (para trocar "baixar" por "compartilhar"). */
export async function noAndroid() {
  try {
    return (await capacitor()).android;
  } catch {
    return false;
  }
}

/** Android: grava a imagem (data URL) e abre o "Compartilhar" (WhatsApp, Drive, Galeria...). */
export async function compartilharImagem(dataUrl: string, nomeArquivo: string) {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const { uri } = await Filesystem.writeFile({
    path: `${nomeArquivo}.png`,
    data: dataUrl.replace(/^data:[^,]+,/, ""),
    directory: Directory.Cache,
  });
  await Share.share({ title: nomeArquivo, files: [uri] });
}

/** Compartilhar um link: navigator.share no navegador/iPhone, o plugin no Android. */
export async function compartilharLink(url: string) {
  if (await noAndroid()) {
    const { Share } = await import("@capacitor/share");
    await Share.share({ url });
    return;
  }
  await navigator.share({ url });
}
