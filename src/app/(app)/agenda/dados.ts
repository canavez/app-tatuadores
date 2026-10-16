import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Sessao, Tatuagem } from "@/lib/agenda";
import type { Pagamento } from "@/lib/financeiro";

export type SessaoCompleta = Sessao & {
  pagamentos: Pagamento[];
  tatuagem: Tatuagem & {
    cliente: { id: string; nome: string; telefone: string | null };
  };
};

export const SELECT_SESSAO_COMPLETA =
  "id, tatuagem_id, inicio, fim, status, observacoes, valor, " +
  "pagamentos(id, sessao_id, valor, data, tipo, forma, observacoes), " +
  "tatuagem:tatuagens!inner(id, cliente_id, descricao, local_corpo, " +
  "cliente:clientes!inner(id, nome, telefone))";

export async function buscarSessao(id: string): Promise<SessaoCompleta> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessoes")
    .select(SELECT_SESSAO_COMPLETA)
    .eq("id", id)
    .order("data", { referencedTable: "pagamentos" })
    .maybeSingle();
  if (!data) notFound();
  return data as unknown as SessaoCompleta;
}

/** Clientes e tatuagens para preencher o formulário de sessão. */
export async function opcoesDoFormulario() {
  const supabase = await createClient();
  const [clientes, tatuagens] = await Promise.all([
    supabase.from("clientes").select("id, nome").order("nome"),
    supabase
      .from("tatuagens")
      .select("id, cliente_id, descricao, local_corpo")
      .order("criado_em", { ascending: false }),
  ]);
  return {
    clientes: (clientes.data ?? []) as { id: string; nome: string }[],
    tatuagens: (tatuagens.data ?? []) as Tatuagem[],
  };
}
