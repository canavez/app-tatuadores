import { createClient } from "@/lib/supabase/server";

/** Nome do espaço de arquivos (Storage) onde ficam as fotos. */
export const ESPACO_FOTOS = "fotos";

/**
 * Links temporários (1 hora) para mostrar as fotos, que ficam num espaço privado.
 * Recebe os caminhos guardados no banco e devolve caminho → link.
 */
export async function linksDasFotos(caminhos: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unicos = [...new Set(caminhos.filter((c): c is string => !!c))];
  if (unicos.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.storage.from(ESPACO_FOTOS).createSignedUrls(unicos, 3600);
  const links = new Map<string, string>();
  for (const d of data ?? []) if (d.path && d.signedUrl) links.set(d.path, d.signedUrl);
  return links;
}

export async function linkDaFoto(caminho: string | null | undefined): Promise<string | null> {
  return (await linksDasFotos([caminho])).get(caminho ?? "") ?? null;
}
