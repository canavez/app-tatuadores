import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ItemEstoque } from "@/lib/estoque";
import { Topo } from "@/components/topo";
import { BotaoExcluir } from "@/components/botao-excluir";
import { excluirItem } from "../actions";
import { ItemForm } from "./item-form";

export default async function ItemEstoquePage({ params }: PageProps<"/estoque/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("itens_estoque")
    .select("id, nome, categoria, quantidade, unidade, estoque_minimo")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const item = data as ItemEstoque;

  return (
    <>
      <Topo titulo={item.nome} voltar="/estoque" />
      <div className="flex flex-col gap-4">
        <ItemForm item={item} />
        <div className="mt-4 flex justify-center">
          <BotaoExcluir
            acao={excluirItem.bind(null, item.id)}
            rotulo="Excluir item"
            confirmacao={`Tirar "${item.nome}" do estoque?`}
          />
        </div>
      </div>
    </>
  );
}
