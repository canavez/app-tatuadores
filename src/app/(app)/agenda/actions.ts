"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dataValida, ehStatus, paraInstante, type StatusSessao } from "@/lib/agenda";
import { ehForma, ehTipo, lerReais, taxaDoPagamento } from "@/lib/financeiro";
import { buscarConfiguracoes } from "@/lib/configuracoes";

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
  let clienteId = texto(formData, "cliente_id");
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

  const clienteNome = clienteId === "novo" ? texto(formData, "cliente_nome") : null;
  if (clienteId === "novo" && !clienteNome) return { erro: "Informe o nome do novo cliente." };
  if (tatuagemId === "nova" && !texto(formData, "descricao")) {
    return { erro: "Descreva a nova tatuagem." };
  }
  const valorDigitado = texto(formData, "valor");
  const valor = lerReais(valorDigitado);
  if (valorDigitado && valor === null) return { erro: "Valor inválido. Ex.: 1500 ou 1.500,00" };

  const supabase = await createClient();

  // Cliente novo entra só com o nome; o resto é completado depois em Clientes.
  let clienteCriado: string | null = null;
  if (clienteId === "novo") {
    const { data: novo, error } = await supabase
      .from("clientes")
      .insert({ nome: clienteNome })
      .select("id")
      .single();
    if (error) return { erro: "Não foi possível cadastrar o cliente." };
    clienteId = clienteCriado = novo.id;
  }

  // Cria a tatuagem junto com a primeira sessão, se for nova.
  let tatuagemCriada: string | null = null;
  if (tatuagemId === "nova") {
    const { data: nova, error } = await supabase
      .from("tatuagens")
      .insert({
        cliente_id: clienteId,
        descricao: texto(formData, "descricao"),
        local_corpo: texto(formData, "local_corpo"),
      })
      .select("id")
      .single();
    if (error) {
      if (clienteCriado) await supabase.from("clientes").delete().eq("id", clienteCriado);
      return { erro: "Não foi possível cadastrar a tatuagem." };
    }
    tatuagemId = tatuagemCriada = nova.id;
  }

  const dados = {
    tatuagem_id: tatuagemId,
    inicio: paraInstante(data, horaInicio),
    fim: paraInstante(data, horaFim),
    status,
    valor,
    observacoes: texto(formData, "observacoes"),
  };

  const resultado = id
    ? await supabase.from("sessoes").update(dados).eq("id", id).select("id").single()
    : await supabase.from("sessoes").insert(dados).select("id").single();

  if (resultado.error) {
    // Desfaz o que foi criado agora (apagar o cliente leva a tatuagem junto).
    if (clienteCriado) await supabase.from("clientes").delete().eq("id", clienteCriado);
    else if (tatuagemCriada) await supabase.from("tatuagens").delete().eq("id", tatuagemCriada);
    if (resultado.error.code === "23P01") {
      return { erro: "Já existe outra sessão nesse horário. Escolha outro horário." };
    }
    return { erro: "Não foi possível salvar a sessão. Tente novamente." };
  }

  revalidatePath("/agenda");
  if (clienteCriado) revalidatePath("/clientes");
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

export async function registrarPagamento(
  sessaoId: string,
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
  // A taxa da maquininha fica gravada com o percentual de hoje.
  const taxa = taxaDoPagamento(await buscarConfiguracoes(), forma, valor);
  const { error } = await supabase.from("pagamentos").insert({
    sessao_id: sessaoId,
    valor,
    taxa,
    data,
    tipo,
    forma,
    observacoes: texto(formData, "observacoes"),
  });
  if (error) return { erro: "Não foi possível registrar o pagamento. Tente novamente." };

  // Sinal recebido confirma a sessão que estava aguardando sinal.
  if (tipo === "sinal") {
    await supabase.from("sessoes").update({ status: "confirmado" }).eq("id", sessaoId).eq("status", "agendado");
  }

  revalidatePath("/", "layout");
  redirect(`/agenda/${sessaoId}`);
}

export async function excluirPagamento(id: string, sessaoId: string) {
  const supabase = await createClient();
  await supabase.from("pagamentos").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/agenda/${sessaoId}`);
}
