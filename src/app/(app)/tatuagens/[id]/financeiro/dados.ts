import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Pagamento } from "@/lib/financeiro";

export type TatuagemFinanceiro = {
  id: string;
  descricao: string;
  local_corpo: string | null;
  valor: number | null;
  cliente: { id: string; nome: string };
};

export async function buscarFinanceiro(id: string) {
  const supabase = await createClient();
  const [tatuagem, pagamentos] = await Promise.all([
    supabase
      .from("tatuagens")
      .select("id, descricao, local_corpo, valor, cliente:clientes!inner(id, nome)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("pagamentos")
      .select("id, tatuagem_id, valor, data, tipo, forma, observacoes")
      .eq("tatuagem_id", id)
      .order("data", { ascending: false })
      .order("criado_em", { ascending: false }),
  ]);
  if (!tatuagem.data) notFound();
  return {
    tatuagem: tatuagem.data as unknown as TatuagemFinanceiro,
    pagamentos: (pagamentos.data ?? []) as Pagamento[],
  };
}

/** Endereço da tela de financeiro, lembrando de onde ela foi aberta. */
export function urlFinanceiro(tatuagemId: string, de: string | null): string {
  const url = `/tatuagens/${tatuagemId}/financeiro`;
  return de ? `${url}?de=${encodeURIComponent(de)}` : url;
}
