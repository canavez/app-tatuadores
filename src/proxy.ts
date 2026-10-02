import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Não passa pela checagem de login: arquivos do Next, manifest e imagens/ícones.
  matcher: [
    "/((?!_next/static|_next/image|manifest.webmanifest|.*\\.(?:svg|png|ico|jpg|jpeg|gif|webp)$).*)",
  ],
};
