"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dataValida, ehStatus, paraInstante, type StatusSessao } from "@/lib/agenda";

export type EstadoForm = { erro?: string } | undefined;

const HORA = /^\d{2}:\d{2}$/;

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

export async function salvarSessao(
  id: string | null,
  _: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const clienteId = texto(formData, "cliente_id");
  let tatuagemId = texto(formData, "tatuagem_id");
  const data = texto(formData, "data");
  const horaInicio = texto(formData, "hora_inicio");
  const horaFim = texto(formData, "hora_fim");
  const status = formData.get("status") ?? "agendado";

  if (!clienteId) return { erro: "Escolha o cliente." };
  if (!tatuagemId) return { erro: "Escolha a tatuagem ou cadastre uma nova." };
  if (!dataValida(data) || !horaInicio || !HORA.test(horaInicio) || !horaFim || !HORA.test(horaFim)) {
    return { erro: "Informe a data e os horários." };
  }
  if (horaFim <= horaInicio) return { erro: "O horário de término precisa ser depois do início." };
  if (!ehStatus(status)) return { erro: "Status inválido." };

  const supabase = await createClient();

  // Cria a tatuagem junto com a primeira sessão, se for nova.
  let tatuagemCriada: string | null = null;
  if (tatuagemId === "nova") {
    const descricao = texto(formData, "descricao");
    if (!descricao) return { erro: "Descreva a nova tatuagem." };
    const { data: nova, error } = await supabase
      .from("tatuagens")
      .insert({ cliente_id: clienteId, descricao, local_corpo: texto(formData, "local_corpo") })
      .select("id")
      .single();
    if (error) return { erro: "Não foi possível cadastrar a tatuagem." };
    tatuagemId = tatuagemCriada = nova.id;
  }

  const dados = {
    tatuagem_id: tatuagemId,
    inicio: paraInstante(data, horaInicio),
    fim: paraInstante(data, horaFim),
    status,
    observacoes: texto(formData, "observacoes"),
  };

  const resultado = id
    ? await supabase.from("sessoes").update(dados).eq("id", id).select("id").single()
    : await supabase.from("sessoes").insert(dados).select("id").single();

  if (resultado.error) {
    if (tatuagemCriada) await supabase.from("tatuagens").delete().eq("id", tatuagemCriada);
    if (resultado.error.code === "23P01") {
      return { erro: "Já existe outra sessão nesse horário. Escolha outro horário." };
    }
    return { erro: "Não foi possível salvar a sessão. Tente novamente." };
  }

  revalidatePath("/agenda");
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/agenda/${resultado.data.id}`);
}

export async function mudarStatus(id: string, status: StatusSessao) {
  const supabase = await createClient();
  const { error } = await supabase.from("sessoes").update({ status }).eq("id", id);
  // Reativar uma sessão cancelada pode bater com outra que ocupou o horário.
  if (error?.code === "23P01") redirect(`/agenda/${id}?erro=conflito`);
  revalidatePath("/agenda");
  redirect(`/agenda/${id}`);
}

export async function excluirSessao(id: string) {
  const supabase = await createClient();
  await supabase.from("sessoes").delete().eq("id", id);
  revalidatePath("/agenda");
  redirect("/agenda");
}
