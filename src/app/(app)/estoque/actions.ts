"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehCategoriaEstoque } from "@/lib/estoque";

export type EstadoForm = { erro?: string } | undefined;

function inteiro(formData: FormData, campo: string): number | null {
  const texto = String(formData.get(campo) ?? "").trim();
  if (texto === "") return 0;
  return /^\d{1,6}$/.test(texto) ? Number(texto) : null;
}

function revalidar() {
  revalidatePath("/estoque", "layout");
  revalidatePath("/hoje");
}

/** Adiciona os itens marcados do catálogo e, se preenchido, um item próprio. */
export async function adicionarItens(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const doCatalogo = formData
    .getAll("item")
    .map((v) => String(v).split("|"))
    .filter(([categoria, nome]) => ehCategoriaEstoque(categoria) && nome)
    .map(([categoria, nome]) => ({ categoria, nome }));

  const nomeProprio = String(formData.get("nome") ?? "").trim();
  const categoriaPropria = formData.get("categoria");
  if (nomeProprio) {
    if (!ehCategoriaEstoque(categoriaPropria)) return { erro: "Escolha a categoria do item." };
    doCatalogo.push({ categoria: categoriaPropria, nome: nomeProprio });
  }

  if (doCatalogo.length === 0) return { erro: "Marque pelo menos um item ou escreva o nome de um item." };

  const supabase = await createClient();
  // Itens que já existem no estoque são ignorados.
  const { error } = await supabase
    .from("itens_estoque")
    .upsert(doCatalogo, { onConflict: "tatuador_id,nome", ignoreDuplicates: true });
  if (error) return { erro: "Não foi possível adicionar os itens. Tente novamente." };

  revalidar();
  redirect("/estoque");
}

export async function ajustarQuantidade(id: string, delta: number) {
  const supabase = await createClient();
  await supabase.rpc("ajustar_estoque", { item: id, delta });
  revalidar();
}

export async function salvarItem(id: string, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = formData.get("categoria");
  const quantidade = inteiro(formData, "quantidade");
  const minimo = inteiro(formData, "estoque_minimo");
  const unidade = String(formData.get("unidade") ?? "").trim() || "un";

  if (!nome) return { erro: "Informe o nome do item." };
  if (!ehCategoriaEstoque(categoria)) return { erro: "Escolha a categoria." };
  if (quantidade === null || minimo === null) {
    return { erro: "Quantidade e estoque mínimo precisam ser números inteiros." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("itens_estoque")
    .update({ nome, categoria, quantidade, estoque_minimo: minimo, unidade })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { erro: "Já existe outro item com esse nome." };
    return { erro: "Não foi possível salvar. Tente novamente." };
  }

  revalidar();
  redirect("/estoque");
}

export async function excluirItem(id: string) {
  const supabase = await createClient();
  await supabase.from("itens_estoque").delete().eq("id", id);
  revalidar();
  redirect("/estoque");
}
