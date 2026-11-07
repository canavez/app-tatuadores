"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ESPACO_FOTOS } from "@/lib/fotos";

/**
 * Guarda (ou apaga) o caminho da foto depois que o navegador já enviou o arquivo.
 * `caminho` null = remover a foto.
 */
export async function salvarFoto(alvo: { cliente: string } | "perfil", caminho: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Só aceita caminhos dentro da pasta do próprio tatuador.
  if (caminho && !caminho.startsWith(`${user.id}/`)) return;

  if (alvo === "perfil") {
    const anterior = user.user_metadata?.foto as string | undefined;
    if (!caminho && anterior) await supabase.storage.from(ESPACO_FOTOS).remove([anterior]);
    await supabase.auth.updateUser({ data: { foto: caminho } });
    // A página de orçamento usa a mesma foto (se o tatuador já criou a página).
    await supabase.from("perfis").update({ foto: caminho }).eq("tatuador_id", user.id);
  } else {
    if (!caminho) {
      const { data } = await supabase.from("clientes").select("foto").eq("id", alvo.cliente).maybeSingle();
      if (data?.foto) await supabase.storage.from(ESPACO_FOTOS).remove([data.foto]);
    }
    await supabase.from("clientes").update({ foto: caminho }).eq("id", alvo.cliente);
  }
  revalidatePath("/", "layout");
}
