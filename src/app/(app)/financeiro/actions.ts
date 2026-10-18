"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dataValida } from "@/lib/agenda";
import { ehCategoria, lerPercentual, lerReais } from "@/lib/financeiro";

export type EstadoForm = { erro?: string } | undefined;

export async function registrarDespesa(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor = lerReais(String(formData.get("valor") ?? "").trim() || null);
  const data = String(formData.get("data") ?? "");
  const categoria = formData.get("categoria");

  if (!descricao) return { erro: "Descreva a despesa. Ex.: tintas, aluguel da sala" };
  if (!valor || valor <= 0) return { erro: "Informe o valor. Ex.: 150 ou 150,00" };
  if (!dataValida(data)) return { erro: "Informe a data da despesa." };
  if (!ehCategoria(categoria)) return { erro: "Escolha a categoria." };

  const supabase = await createClient();
  const { error } = await supabase.from("despesas").insert({ descricao, valor, data, categoria });
  if (error) return { erro: "Não foi possível registrar a despesa. Tente novamente." };

  revalidatePath("/financeiro");
  // Volta para o mês da despesa.
  redirect(`/financeiro?mes=${data.slice(0, 7)}`);
}

export async function excluirDespesa(id: string, mes: string) {
  const supabase = await createClient();
  await supabase.from("despesas").delete().eq("id", id);
  revalidatePath("/financeiro");
  redirect(`/financeiro?mes=${mes}`);
}

export async function salvarTaxas(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const campos = ["taxa_debito", "taxa_credito", "comissao_estudio"] as const;
  const valores: Record<string, number> = {};
  for (const campo of campos) {
    const valor = lerPercentual(String(formData.get(campo) ?? "").trim() || null);
    if (valor === null) return { erro: "Use percentuais de 0 a 100. Ex.: 3,5" };
    valores[campo] = valor;
  }

  const modelo = formData.get("modelo") === "proprio" ? "proprio" : "comissao";
  const fixasDigitado = String(formData.get("contas_fixas") ?? "").trim() || null;
  const contasFixas = fixasDigitado ? lerReais(fixasDigitado) : 0;
  if (contasFixas === null) return { erro: "Valor das contas fixas inválido. Ex.: 1.200,00" };

  const supabase = await createClient();
  const { error } = await supabase.from("configuracoes").upsert({
    ...valores,
    taxa_pix: 0, // Pix não tem taxa.
    modelo,
    contas_fixas: contasFixas,
    atualizado_em: new Date().toISOString(),
  });
  if (error) return { erro: "Não foi possível salvar. Tente novamente." };

  // As taxas valem para os próximos pagamentos; o resultado do mês já recalcula.
  revalidatePath("/", "layout");
  redirect("/financeiro");
}
