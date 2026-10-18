"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lerPercentual, lerReais } from "@/lib/financeiro";

export type EstadoConta = { erro?: string; mensagem?: string } | undefined;

export async function salvarNome(_: EstadoConta, formData: FormData): Promise<EstadoConta> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { erro: "Informe seu nome." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { nome } });
  if (error) return { erro: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/conta");
  return { mensagem: "Nome salvo." };
}

export async function salvarTaxas(_: EstadoConta, formData: FormData): Promise<EstadoConta> {
  const campos = ["taxa_debito", "taxa_credito", "taxa_pix", "comissao_estudio"] as const;
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
    modelo,
    contas_fixas: contasFixas,
    atualizado_em: new Date().toISOString(),
  });
  if (error) return { erro: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/", "layout");
  return { mensagem: "Configurações salvas." };
}
