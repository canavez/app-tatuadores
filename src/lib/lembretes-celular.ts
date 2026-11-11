import type { Lembrete } from "./lembretes";

// Notificações agendadas no próprio celular (iPhone ou Android) (só no app instalado pela loja, não no site).
// Os plugins são carregados só quando usados: no servidor e no navegador comum não existem.

const CHAVE = "ravenn:lembretes"; // "desligado" quando o tatuador desliga em Conta
/** Evento para pedir um novo agendamento (ex.: logo depois de ativar). */
export const EVENTO_REAGENDAR = "ravenn:reagendar";

export type EstadoLembretes = "fora-do-app" | "desligado" | "pedir" | "negado" | "ligado";

async function plugins() {
  const [{ Capacitor }, { LocalNotifications }] = await Promise.all([
    import("@capacitor/core"),
    import("@capacitor/local-notifications"),
  ]);
  return { noApp: Capacitor.isNativePlatform(), LocalNotifications };
}

function desligadoPeloUsuario() {
  try {
    return localStorage.getItem(CHAVE) === "desligado";
  } catch {
    return false;
  }
}

export async function estadoLembretes(): Promise<EstadoLembretes> {
  const { noApp, LocalNotifications } = await plugins();
  if (!noApp) return "fora-do-app";
  if (desligadoPeloUsuario()) return "desligado";
  const { display } = await LocalNotifications.checkPermissions();
  return display === "granted" ? "ligado" : display === "denied" ? "negado" : "pedir";
}

/** Pede a permissão do celular (a janela "Permitir notificações?") e agenda. */
export async function ativarLembretes(): Promise<EstadoLembretes> {
  try {
    localStorage.removeItem(CHAVE);
  } catch {}
  const { LocalNotifications } = await plugins();
  await LocalNotifications.requestPermissions();
  window.dispatchEvent(new Event(EVENTO_REAGENDAR));
  return estadoLembretes();
}

export async function desligarLembretes(): Promise<EstadoLembretes> {
  try {
    localStorage.setItem(CHAVE, "desligado");
  } catch {}
  await cancelarTodos();
  return "desligado";
}

async function cancelarTodos() {
  const { LocalNotifications } = await plugins();
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: notifications.map((n) => ({ id: n.id })) });
  }
}

/** Troca os lembretes agendados pelos novos (as sessões podem ter mudado). */
export async function reagendar(lembretes: Lembrete[]) {
  const { LocalNotifications } = await plugins();
  await cancelarTodos();
  if (lembretes.length === 0) return;
  await LocalNotifications.schedule({
    notifications: lembretes.map((l) => ({
      id: l.id,
      title: l.titulo,
      body: l.corpo,
      schedule: { at: new Date(l.quando), allowWhileIdle: true },
      // Android: sem alarme exato (senão o app abriria os ajustes de "Alarmes e lembretes"
      // toda vez). O aviso pode sair com alguns minutos de folga. No iPhone não muda nada.
      isExactNotification: false,
      extra: { url: l.url },
    })),
  });
}

/** Ao tocar numa notificação, chama `abrir` com a tela dela. Devolve o "desligar". */
export async function aoTocarNotificacao(abrir: (url: string) => void) {
  const { noApp, LocalNotifications } = await plugins();
  if (!noApp) return () => {};
  const ouvinte = await LocalNotifications.addListener("localNotificationActionPerformed", (acao) => {
    const url = acao.notification.extra?.url;
    if (typeof url === "string" && url.startsWith("/")) abrir(url);
  });
  return () => void ouvinte.remove();
}
