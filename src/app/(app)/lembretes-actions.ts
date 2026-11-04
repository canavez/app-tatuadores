"use server";

import { createClient } from "@/lib/supabase/server";
import { montarLembretes, DIAS_DE_LEMBRETE, type Lembrete, type SessaoParaLembrete } from "@/lib/lembretes";

type Linha = {
  id: string;
  inicio: string;
  status: SessaoParaLembrete["status"];
  tatuagem: { descricao: string | null; cliente: { nome: string } };
};

/** Lembretes das próximas sessões, para o app do iPhone agendar no aparelho. */
export async function lembretesDasProximasSessoes(): Promise<Lembrete[]> {
  const supabase = await createClient();
  const agora = new Date();
  const ate = new Date(agora.getTime() + DIAS_DE_LEMBRETE * 86_400_000);
  const { data, error } = await supabase
    .from("sessoes")
    .select("id, inicio, status, tatuagem:tatuagens!inner(descricao, cliente:clientes!inner(nome))")
    .in("status", ["agendado", "confirmado"])
    .gt("inicio", agora.toISOString())
    .lt("inicio", ate.toISOString())
    .order("inicio");
  if (error) throw new Error("Não foi possível buscar as sessões.");

  const sessoes = ((data ?? []) as unknown as Linha[]).map((s) => ({
    id: s.id,
    inicio: s.inicio,
    status: s.status,
    cliente: s.tatuagem.cliente.nome,
    tatuagem: s.tatuagem.descricao,
  }));
  return montarLembretes(sessoes, agora);
}
