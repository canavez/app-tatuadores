import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/clientes";
import type { Anamnese } from "@/lib/anamnese";

export async function buscarCliente(id: string): Promise<Cliente> {
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return data as Cliente;
}

/** Anamnese do cliente, ou null se ainda não foi preenchida. */
export async function buscarAnamnese(clienteId: string): Promise<Anamnese | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("anamneses")
    .select("*")
    .eq("cliente_id", clienteId)
    .maybeSingle();
  return data as Anamnese | null;
}
