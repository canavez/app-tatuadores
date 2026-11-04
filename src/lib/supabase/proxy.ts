import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LIVRES_SEM_ASSINATURA, situacaoDa } from "@/lib/assinatura-regras";

// "/privacidade" fica aberta: as lojas de apps pedem o link da política sem login.
const ROTAS_PUBLICAS = ["/login", "/auth", "/privacidade"];

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
  const publica = ROTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  if (!user && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
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
