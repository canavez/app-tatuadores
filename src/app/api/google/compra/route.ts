import { CompraDeOutraConta, sincronizarGoogle, TokenInvalido } from "@/lib/google";
import { createClient } from "@/lib/supabase/server";

// O app de Android chama aqui logo depois que a pessoa paga (ou toca em "Restaurar compras"),
// mandando o token da compra. O servidor confere com o Google e libera o acesso na hora.

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ erro: "Entre na sua conta." }, { status: 401 });

  const corpo = await request.json().catch(() => null);
  const token = typeof corpo?.token === "string" ? corpo.token : null;
  if (!token) return Response.json({ erro: "Compra não enviada." }, { status: 400 });

  try {
    const resultado = await sincronizarGoogle(token, user.id);
    if (!resultado) return Response.json({ erro: "Esta compra não é a assinatura do Ravenn." }, { status: 400 });
    return Response.json({ ok: true, ...resultado });
  } catch (erro) {
    if (erro instanceof TokenInvalido) {
      return Response.json({ erro: "Não foi possível confirmar a compra com o Google." }, { status: 400 });
    }
    if (erro instanceof CompraDeOutraConta) {
      return Response.json(
        { erro: "Esta assinatura do Google Play já está ligada a outra conta do Ravenn." },
        { status: 409 },
      );
    }
    console.error("Compra do Google:", erro);
    return Response.json({ erro: "Não foi possível salvar a assinatura. Tente de novo." }, { status: 500 });
  }
}
