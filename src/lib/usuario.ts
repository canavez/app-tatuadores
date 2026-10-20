import type { User } from "@supabase/supabase-js";

/**
 * Nome do tatuador: o que ele cadastrou na Conta ou, se entrou com Google/Apple,
 * o nome que veio de lá. Vazio se não houver nenhum.
 */
export function nomeDoUsuario(user: User | null | undefined): string {
  const dados = user?.user_metadata ?? {};
  return String(dados.nome ?? dados.full_name ?? dados.name ?? "").trim();
}
