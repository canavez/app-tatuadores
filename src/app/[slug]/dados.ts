import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ESPACO_FOTOS } from "@/lib/fotos";
import { erroDoSlug, type Perfil } from "@/lib/orcamentos";

/** Perfil público pelo link (uma busca por visita, mesmo usada no título e na página). */
export const buscarPerfil = cache(async (slug: string): Promise<(Perfil & { fotoUrl: string | null }) | null> => {
  const limpo = decodeURIComponent(slug).toLowerCase();
  if (erroDoSlug(limpo)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select("tatuador_id, slug, nome, bio, foto, aceitando")
    .eq("slug", limpo)
    .maybeSingle();
  if (!data) return null;
  const perfil = data as Perfil;
  let fotoUrl: string | null = null;
  if (perfil.foto) {
    const { data: link } = await supabase.storage.from(ESPACO_FOTOS).createSignedUrl(perfil.foto, 3600);
    fotoUrl = link?.signedUrl ?? null;
  }
  return { ...perfil, fotoUrl };
});
