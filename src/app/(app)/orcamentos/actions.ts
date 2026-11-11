"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ESPACO_FOTOS } from "@/lib/fotos";
import { formatarTelefone, type StatusOrcamento } from "@/lib/orcamentos";

function atualizarTelas(id: string) {
  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/hoje");
}

/** Tocou no WhatsApp: o orçamento sai dos novos. */
export async function marcarRespondido(id: string) {
  const supabase = await createClient();
  await supabase.from("orcamentos").update({ status: "respondido" }).eq("id", id).eq("status", "novo");
  atualizarTelas(id);
}

export async function mudarStatus(id: string, status: StatusOrcamento) {
  const supabase = await createClient();
  await supabase.from("orcamentos").update({ status }).eq("id", id);
  atualizarTelas(id);
}

export async function excluirOrcamento(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("orcamentos").select("imagens").eq("id", id).maybeSingle();
  if (data?.imagens?.length) await supabase.storage.from(ESPACO_FOTOS).remove(data.imagens);
  await supabase.from("orcamentos").delete().eq("id", id);
  revalidatePath("/orcamentos");
  revalidatePath("/hoje");
  redirect("/orcamentos");
}

/** Liga o pedido a um cliente que já estava cadastrado (mesmo celular). */
export async function ligarCliente(id: string, clienteId: string) {
  const supabase = await createClient();
  await supabase.from("orcamentos").update({ cliente_id: clienteId }).eq("id", id);
  revalidatePath(`/clientes/${clienteId}`);
  atualizarTelas(id);
}

/** Cadastra quem pediu o orçamento como cliente (nome, celular e a ideia nas observações). */
export async function virarCliente(id: string) {
  const supabase = await createClient();
  const { data: o } = await supabase
    .from("orcamentos")
    .select("nome, telefone, descricao, local_corpo, cliente_id")
    .eq("id", id)
    .maybeSingle();
  if (!o) redirect("/orcamentos");
  if (o.cliente_id) redirect(`/clientes/${o.cliente_id}`);

  const ideia = [o.local_corpo && `Local: ${o.local_corpo}`, o.descricao].filter(Boolean).join("\n");
  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({ nome: o.nome, telefone: formatarTelefone(o.telefone), observacoes: `Pedido de orçamento:\n${ideia}` })
    .select("id")
    .single();
  if (error || !cliente) redirect(`/orcamentos/${id}?erro=cliente`);

  await supabase.from("orcamentos").update({ cliente_id: cliente.id }).eq("id", id);
  revalidatePath("/clientes");
  atualizarTelas(id);
  redirect(`/clientes/${cliente.id}`);
}
