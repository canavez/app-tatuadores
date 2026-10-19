"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function salvarHorario(_: EstadoConta, formData: FormData): Promise<EstadoConta> {
  const inicio = String(formData.get("hora_inicio") ?? "");
  const fim = String(formData.get("hora_fim") ?? "");
  if (!/^\d{2}:\d{2}$/.test(inicio) || !/^\d{2}:\d{2}$/.test(fim)) return { erro: "Informe os dois horários." };
  if (fim <= inicio) return { erro: "O fim do expediente precisa ser depois do início." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracoes")
    .upsert({ hora_inicio: inicio, hora_fim: fim, atualizado_em: new Date().toISOString() });
  if (error) return { erro: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/", "layout");
  return { mensagem: "Horário salvo." };
}
