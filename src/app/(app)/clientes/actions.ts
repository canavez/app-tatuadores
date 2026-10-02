"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoForm = { erro?: string } | undefined;

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

export async function salvarCliente(
  id: string | null,
  _: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const dados = {
    nome: texto(formData, "nome"),
    telefone: texto(formData, "telefone"),
    email: texto(formData, "email"),
    instagram: texto(formData, "instagram")?.replace(/^@/, "") ?? null,
    cpf: texto(formData, "cpf"),
    data_nascimento: texto(formData, "data_nascimento"),
    observacoes: texto(formData, "observacoes"),
  };

  if (!dados.nome) return { erro: "Informe o nome do cliente." };

  const supabase = await createClient();
  const resultado = id
    ? await supabase.from("clientes").update(dados).eq("id", id).select("id").single()
    : await supabase.from("clientes").insert(dados).select("id").single();

  if (resultado.error) {
    return { erro: "Não foi possível salvar o cliente. Tente novamente." };
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${resultado.data.id}`);
}

export async function excluirCliente(id: string) {
  const supabase = await createClient();
  await supabase.from("clientes").delete().eq("id", id);
  revalidatePath("/clientes");
  redirect("/clientes");
}
