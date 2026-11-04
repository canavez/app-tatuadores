import { CompraDeOutraConta, conferirTransacao, sincronizarApple } from "@/lib/apple";
import { createClient } from "@/lib/supabase/server";

// O app do iPhone chama aqui logo depois que a pessoa paga (ou toca em "Restaurar compras"),
// mandando a compra assinada pela Apple. Libera o acesso na hora, sem esperar o aviso da Apple.

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ erro: "Entre na sua conta." }, { status: 401 });

  const corpo = await request.json().catch(() => null);
  const jws = typeof corpo?.jws === "string" ? corpo.jws : null;
  if (!jws) return Response.json({ erro: "Compra não enviada." }, { status: 400 });

  let transacao;
  try {
    transacao = await conferirTransacao(jws);
  } catch (erro) {
    console.error("Compra da Apple inválida:", erro);
    return Response.json({ erro: "Não foi possível confirmar a compra com a Apple." }, { status: 400 });
  }

  try {
    const resultado = await sincronizarApple(transacao, undefined, user.id);
    if (!resultado) return Response.json({ erro: "Esta compra não é a assinatura do Ravenn." }, { status: 400 });
    return Response.json({ ok: true, ...resultado });
  } catch (erro) {
    if (erro instanceof CompraDeOutraConta) {
      return Response.json(
        { erro: "Esta assinatura da Apple já está ligada a outra conta do Ravenn." },
        { status: 409 },
      );
    }
    console.error("Compra da Apple:", erro);
    return Response.json({ erro: "Não foi possível salvar a assinatura. Tente de novo." }, { status: 500 });
  }
}
