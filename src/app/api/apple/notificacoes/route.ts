import { conferirNotificacao, conferirRenovacao, conferirTransacao, sincronizarApple } from "@/lib/apple";

// Endereço que a Apple chama a cada mudança na assinatura (App Store Server Notifications V2):
// assinou, renovou, desligou a renovação, cobrança falhou, expirou, reembolso.
// Cadastre no App Store Connect (produção e Sandbox): https://ravenn.me/api/apple/notificacoes
// Fica aberto sem login (ver ROTAS_PUBLICAS no proxy); quem garante que é a Apple é a assinatura.

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  if (typeof corpo?.signedPayload !== "string") return new Response("Sem aviso", { status: 400 });

  let aviso;
  try {
    aviso = await conferirNotificacao(corpo.signedPayload);
  } catch (erro) {
    console.error("Aviso da Apple inválido:", erro);
    return new Response("Assinatura inválida", { status: 400 });
  }

  try {
    const { signedTransactionInfo, signedRenewalInfo } = aviso.data ?? {};
    if (signedTransactionInfo) {
      const transacao = await conferirTransacao(signedTransactionInfo);
      const renovacao = signedRenewalInfo ? await conferirRenovacao(signedRenewalInfo) : undefined;
      await sincronizarApple(transacao, renovacao);
    }
  } catch (erro) {
    // Erro 500 faz a Apple tentar de novo mais tarde.
    console.error("Aviso da Apple:", aviso.notificationType, erro);
    return new Response("Erro ao processar", { status: 500 });
  }

  return Response.json({ recebido: true });
}
