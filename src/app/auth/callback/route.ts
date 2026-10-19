import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Recebe o link do e-mail (confirmação de conta ou nova senha) e cria a sessão.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const proximo = searchParams.get("proximo");
  // Só aceita telas do próprio app (evita redirecionar para outro site).
  const destino = proximo && /^\/[\w/-]*$/.test(proximo) ? proximo : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
