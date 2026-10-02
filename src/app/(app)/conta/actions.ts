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
