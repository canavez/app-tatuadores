"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dataValida } from "@/lib/agenda";
import { ehCategoria, lerReais } from "@/lib/financeiro";

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
