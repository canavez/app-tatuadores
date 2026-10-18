import { createClient } from "@/lib/supabase/server";
import { SEM_CONFIGURACAO, type Configuracoes } from "@/lib/financeiro";

/** Taxas e comissão do tatuador logado (zeradas se ainda não configurou). */
export async function buscarConfiguracoes(): Promise<Configuracoes> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracoes")
    .select("taxa_debito, taxa_credito, taxa_pix, comissao_estudio")
    .maybeSingle();
  return (data as Configuracoes | null) ?? SEM_CONFIGURACAO;
}
