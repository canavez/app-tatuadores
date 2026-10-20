"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ESPACO_FOTOS } from "@/lib/fotos";
import { CONDICOES, TEXTOS } from "@/lib/anamnese";

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

  // A anamnese só aparece (e só é salva) na edição do cliente.
  if (id && formData.get("com_anamnese")) {
    const condicoes = Object.fromEntries(
      CONDICOES.map((c) => [c.campo, formData.get(c.campo) === "on"]),
    );
    const textos = Object.fromEntries(TEXTOS.map((t) => [t.campo, texto(formData, t.campo)]));
    // Não cria uma anamnese vazia só porque o cliente foi editado.
    const preenchida =
      formData.get("anamnese_existente") ||
      formData.get("nada_consta") ||
      Object.values(condicoes).some(Boolean) ||
      Object.values(textos).some(Boolean);

    if (preenchida) {
      const { error } = await supabase
        .from("anamneses")
        .upsert({ cliente_id: id, ...condicoes, ...textos });
      if (error) {
        return { erro: "Os dados do cliente foram salvos, mas a anamnese não. Tente novamente." };
      }
    }
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${resultado.data.id}`);
}

export async function excluirCliente(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("foto").eq("id", id).maybeSingle();
  if (data?.foto) await supabase.storage.from(ESPACO_FOTOS).remove([data.foto]);
  await supabase.from("clientes").delete().eq("id", id);
  revalidatePath("/clientes");
  redirect("/clientes");
}
