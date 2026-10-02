"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcularIdade } from "@/lib/clientes";
import { VERSAO_TERMO, textoDoTermo } from "@/lib/termo";
import { buscarTatuagemETermo, destinoSeguro, urlDoTermo } from "./dados";

export type EstadoTermo = { erro?: string } | undefined;

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

export async function assinarTermo(
  tatuagemId: string,
  de: string | null,
  _: EstadoTermo,
  formData: FormData,
): Promise<EstadoTermo> {
  const nome = texto(formData, "nome_assinante");
  const cpf = texto(formData, "cpf_assinante");
  const assinatura = String(formData.get("assinatura") ?? "");

  if (!nome) return { erro: "Informe o nome completo de quem está assinando." };
  if (formData.get("concordo") !== "on") return { erro: "É preciso marcar que leu e concorda com o termo." };
  if (!assinatura.startsWith("data:image/png;base64,")) return { erro: "Falta a assinatura no quadro." };
  if (assinatura.length >= 400_000) return { erro: "Assinatura muito grande. Limpe e assine de novo." };

  // O texto é montado aqui no servidor, com os dados do banco (não confia no navegador).
  const { tatuagem, termo, nomeTatuador } = await buscarTatuagemETermo(tatuagemId);
  if (termo) return { erro: "Esta tatuagem já tem um termo assinado." };

  const idade = calcularIdade(tatuagem.cliente.data_nascimento);
  let responsavel: { nome: string; cpf: string } | null = null;
  if (idade !== null && idade < 18) {
    const nomeResp = texto(formData, "responsavel_nome");
    const cpfResp = texto(formData, "responsavel_cpf");
    if (!nomeResp || !cpfResp) {
      return { erro: "Cliente menor de idade: informe nome e CPF do responsável legal." };
    }
    responsavel = { nome: nomeResp, cpf: cpfResp };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("termos").insert({
    tatuagem_id: tatuagemId,
    versao: VERSAO_TERMO,
    texto: textoDoTermo({
      cliente: nome,
      cpf,
      tatuagem: tatuagem.descricao,
      localCorpo: tatuagem.local_corpo,
      tatuador: nomeTatuador,
      responsavel,
    }),
    nome_assinante: nome,
    cpf_assinante: cpf,
    responsavel_nome: responsavel?.nome ?? null,
    responsavel_cpf: responsavel?.cpf ?? null,
    autoriza_imagem: formData.get("autoriza_imagem") === "on",
    assinatura,
  });
  if (error) return { erro: "Não foi possível salvar o termo. Tente novamente." };

  revalidatePath(`/clientes/${tatuagem.cliente.id}`);
  redirect(urlDoTermo(tatuagemId, destinoSeguro(de)));
}

export async function excluirTermo(tatuagemId: string, de: string | null) {
  const supabase = await createClient();
  await supabase.from("termos").delete().eq("tatuagem_id", tatuagemId);
  redirect(urlDoTermo(tatuagemId, destinoSeguro(de)));
}
