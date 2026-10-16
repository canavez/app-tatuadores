"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dataValida } from "@/lib/agenda";
import { ehForma, ehTipo, lerReais } from "@/lib/financeiro";
import { urlFinanceiro } from "./dados";

export type EstadoForm = { erro?: string } | undefined;

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

// Valores aparecem na agenda, no cliente e no resumo do mês: atualiza todas as telas.
function revalidarTudo() {
  revalidatePath("/", "layout");
}

export async function salvarValor(
  tatuagemId: string,
  _: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const digitado = texto(formData, "valor");
  const valor = lerReais(digitado);
  if (digitado && valor === null) return { erro: "Valor inválido. Ex.: 1500 ou 1.500,00" };

  const supabase = await createClient();
  const { error } = await supabase.from("tatuagens").update({ valor }).eq("id", tatuagemId);
  if (error) return { erro: "Não foi possível salvar o valor." };

  revalidarTudo();
  return undefined;
}

export async function registrarPagamento(
  tatuagemId: string,
  de: string | null,
  sessaoId: string | null,
  _: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const valor = lerReais(texto(formData, "valor"));
  const data = texto(formData, "data");
  const tipo = formData.get("tipo");
  const forma = formData.get("forma");

  if (!valor || valor <= 0) return { erro: "Informe o valor recebido. Ex.: 200 ou 200,00" };
  if (!dataValida(data)) return { erro: "Informe a data do pagamento." };
  if (!ehTipo(tipo)) return { erro: "Escolha se é sinal ou pagamento." };
  if (!ehForma(forma)) return { erro: "Escolha a forma de pagamento." };

  const supabase = await createClient();
  const { error } = await supabase.from("pagamentos").insert({
    tatuagem_id: tatuagemId,
    valor,
    data,
    tipo,
    forma,
    observacoes: texto(formData, "observacoes"),
  });
  if (error) return { erro: "Não foi possível registrar o pagamento. Tente novamente." };

  // Sinal recebido confirma a sessão que estava aguardando sinal.
  if (tipo === "sinal" && sessaoId) {
    await supabase
      .from("sessoes")
      .update({ status: "confirmado" })
      .eq("id", sessaoId)
      .eq("tatuagem_id", tatuagemId)
      .eq("status", "agendado");
  }

  revalidarTudo();
  // Aberto pela sessão: volta para ela; senão, mostra o financeiro da tatuagem.
  redirect(sessaoId && de ? de : urlFinanceiro(tatuagemId, de));
}

export async function excluirPagamento(id: string, tatuagemId: string, de: string | null) {
  const supabase = await createClient();
  await supabase.from("pagamentos").delete().eq("id", id);
  revalidarTudo();
  redirect(urlFinanceiro(tatuagemId, de));
}
