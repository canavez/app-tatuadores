"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { erroDoSlug, limparSlug } from "@/lib/orcamentos";

export type EstadoPagina = { erro?: string; mensagem?: string; slug?: string } | undefined;

export async function salvarPagina(_: EstadoPagina, formData: FormData): Promise<EstadoPagina> {
  const slug = limparSlug(String(formData.get("slug") ?? ""));
  const nome = String(formData.get("nome") ?? "").trim().slice(0, 120);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 500) || null;
  const aceitando = formData.get("aceitando") === "on";

  const erroSlug = erroDoSlug(slug);
  if (erroSlug) return { erro: erroSlug };
  if (!nome) return { erro: "Informe o nome que aparece na página." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Entre de novo na sua conta." };

  const { error } = await supabase.from("perfis").upsert({
    tatuador_id: user.id,
    slug,
    nome,
    bio,
    aceitando,
    foto: (user.user_metadata?.foto as string | undefined) ?? null,
  });
  if (error?.code === "23505") return { erro: "Esse link já está sendo usado por outro tatuador. Escolha outro." };
  if (error) return { erro: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/conta/pagina");
  revalidatePath("/orcamentos");
  revalidatePath(`/${slug}`);
  return { mensagem: "Página salva.", slug };
}
