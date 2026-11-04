"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ESPACO_FOTOS } from "@/lib/fotos";

export type EstadoExcluir = { erro?: string } | undefined;

/** Palavra que o tatuador digita para confirmar (não tem volta). */
const CONFIRMACAO = "EXCLUIR";

export async function excluirConta(_: EstadoExcluir, formData: FormData): Promise<EstadoExcluir> {
  if (String(formData.get("confirmacao") ?? "").trim().toUpperCase() !== CONFIRMACAO) {
    return { erro: `Digite ${CONFIRMACAO} para confirmar.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // As fotos ficam no Storage, fora das tabelas: apaga antes da conta.
  const fotos = supabase.storage.from(ESPACO_FOTOS);
  const [{ data: raiz }, { data: clientes }] = await Promise.all([
    fotos.list(user.id),
    fotos.list(`${user.id}/clientes`, { limit: 10_000 }),
  ]);
  const caminhos = [
    ...(raiz ?? []).filter((f) => f.id).map((f) => `${user.id}/${f.name}`),
    ...(clientes ?? []).map((f) => `${user.id}/clientes/${f.name}`),
  ];
  if (caminhos.length > 0) {
    const { error } = await fotos.remove(caminhos);
    if (error) return { erro: "Não foi possível excluir a conta. Tente novamente." };
  }

  // Apaga o usuário; clientes, sessões, anamneses, termos, financeiro e estoque vão junto.
  const { error } = await supabase.rpc("excluir_minha_conta");
  if (error) return { erro: "Não foi possível excluir a conta. Tente novamente." };

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?conta=excluida");
}
