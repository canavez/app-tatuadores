import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/clientes";

export type Termo = {
  id: string;
  versao: string;
  texto: string;
  nome_assinante: string;
  cpf_assinante: string | null;
  responsavel_nome: string | null;
  responsavel_cpf: string | null;
  autoriza_imagem: boolean;
  assinatura: string;
  assinado_em: string;
};

export type TatuagemDoTermo = {
  id: string;
  descricao: string;
  local_corpo: string | null;
  cliente: Cliente;
};

/** Tela de onde o termo foi aberto (sessão ou cliente); só aceita telas do próprio app. */
export function destinoSeguro(de: unknown): string | null {
  return typeof de === "string" && /^\/(agenda|clientes)\/[\w-]+$/.test(de) ? de : null;
}

export function urlDoTermo(tatuagemId: string, de: string | null): string {
  const url = `/tatuagens/${tatuagemId}/termo`;
  return de ? `${url}?de=${encodeURIComponent(de)}` : url;
}

export async function buscarTatuagemETermo(id: string) {
  const supabase = await createClient();
  const [tatuagem, termo, usuario] = await Promise.all([
    supabase
      .from("tatuagens")
      .select("id, descricao, local_corpo, cliente:clientes!inner(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("termos").select("*").eq("tatuagem_id", id).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (!tatuagem.data) notFound();

  const user = usuario.data.user;
  const nome = user?.user_metadata?.nome as string | undefined;
  return {
    tatuagem: tatuagem.data as unknown as TatuagemDoTermo,
    termo: termo.data as Termo | null,
    nomeTatuador: nome ?? user?.email ?? "o(a) tatuador(a)",
    tatuadorSemNome: !nome,
  };
}
