import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LIVRES_SEM_ASSINATURA, situacaoDa } from "@/lib/assinatura-regras";

// Abertas sem login: páginas que as lojas de apps e o Stripe conferem (política,
// termos, suporte), o aviso automático do Stripe (webhook, que confere a própria
// assinatura) e a página inicial "/" (só ela, não tudo que começa com "/").
const ROTAS_PUBLICAS = ["/login", "/auth", "/privacidade", "/termos", "/suporte", "/api/stripe/webhook", "/api/apple/notificacoes"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Não coloque código entre createServerClient e getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const publica = pathname === "/" || ROTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  if (!user && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logado não vê a página inicial nem o login: vai direto para o app.
  if (user && (pathname === "/login" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/hoje";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Assinatura vencida: só ficam abertas a tela de assinar, a Conta e o relatório
  // (a pessoa nunca perde acesso aos próprios dados nem à exclusão da conta).
  const livre = LIVRES_SEM_ASSINATURA.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (user && !publica && !livre) {
    const { data } = await supabase
      .from("assinaturas")
      .select("teste_ate, pago_ate, origem")
      .maybeSingle();
    if (data && situacaoDa(data).situacao === "vencida") {
      const url = request.nextUrl.clone();
      url.pathname = "/assinatura";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
