"use server";

import { createClient } from "@/lib/supabase/server";
import { LOCAIS_DO_CORPO, MAX_IMAGENS } from "@/lib/orcamentos";

export type ResultadoEnvio = { ok: true } | { erro: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function texto(formData: FormData, campo: string, max: number): string {
  return String(formData.get(campo) ?? "").trim().slice(0, max);
}

/** Grava o pedido de orçamento (as imagens já foram enviadas pelo navegador). */
export async function enviarOrcamento(formData: FormData): Promise<ResultadoEnvio> {
  // Campo escondido: só robôs preenchem.
  if (texto(formData, "site", 200)) return { ok: true };

  const id = texto(formData, "id", 36);
  const tatuadorId = texto(formData, "tatuador_id", 36);
  if (!UUID.test(id) || !UUID.test(tatuadorId)) return { erro: "Não foi possível enviar. Recarregue a página." };

  const nome = texto(formData, "nome", 120);
  const telefone = texto(formData, "telefone", 30);
  const descricao = texto(formData, "descricao", 2000);
  const local = texto(formData, "local_corpo", 120);
  const digitos = telefone.replace(/\D/g, "");

  if (!nome) return { erro: "Informe seu nome." };
  if (digitos.length < 10 || digitos.length > 13) return { erro: "Informe seu celular com DDD." };
  if (!descricao) return { erro: "Conte um pouco da sua ideia." };

  // Só aceita imagens que foram para a pasta deste orçamento.
  const prefixo = `${tatuadorId}/orcamentos/${id}-`;
  const imagens = formData
    .getAll("imagens")
    .map(String)
    .filter((c) => c.startsWith(prefixo) && /^\d+\.jpg$/.test(c.slice(prefixo.length)))
    .slice(0, MAX_IMAGENS);

  const supabase = await createClient();
  const { error } = await supabase.from("orcamentos").insert({
    id,
    tatuador_id: tatuadorId,
    nome,
    telefone,
    descricao,
    local_corpo: LOCAIS_DO_CORPO.includes(local) ? local : local || null,
    imagens,
  });
  if (error) return { erro: "Não foi possível enviar seu pedido. Tente novamente." };
  return { ok: true };
}
