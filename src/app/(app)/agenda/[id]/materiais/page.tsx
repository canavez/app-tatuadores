import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { nomeDoDia, partesLocais } from "@/lib/agenda";
import { CATEGORIAS_DA_SESSAO, CATEGORIAS_ESTOQUE, type ItemEstoque } from "@/lib/estoque";
import { Topo } from "@/components/topo";
import { buscarSessao } from "../../dados";
import { mudarStatus } from "../../actions";
import { MateriaisForm } from "./materiais-form";

export default async function MateriaisPage({ params, searchParams }: PageProps<"/agenda/[id]/materiais">) {
  const { id } = await params;
  const realizar = (await searchParams).realizar === "1";
  const sessao = await buscarSessao(id);

  const supabase = await createClient();
  const [{ data: estoque }, { data: registrados }] = await Promise.all([
    supabase
      .from("itens_estoque")
      .select("id, nome, categoria, quantidade")
      .in("categoria", CATEGORIAS_DA_SESSAO)
      .order("nome"),
    supabase.from("sessao_materiais").select("item_id, quantidade").eq("sessao_id", id),
  ]);
  const usados = Object.fromEntries((registrados ?? []).map((m) => [m.item_id, m.quantidade]));
  // Itens zerados não aparecem, a não ser que já tenham sido usados nesta sessão (para poder corrigir).
  const itens = ((estoque ?? []) as Pick<ItemEstoque, "id" | "nome" | "categoria" | "quantidade">[]).filter(
    (i) => i.quantidade > 0 || usados[i.id],
  );

  const grupos = CATEGORIAS_DA_SESSAO.map((categoria) => ({
    rotulo: CATEGORIAS_ESTOQUE[categoria],
    itens: itens.filter((i) => i.categoria === categoria),
  })).filter((g) => g.itens.length > 0);

  const acaoPular = mudarStatus.bind(null, id, "realizado");

  return (
    <>
      <Topo
        titulo={realizar ? "Sessão realizada" : "Materiais usados"}
        subtitulo={`${sessao.tatuagem.cliente.nome} · ${nomeDoDia(partesLocais(sessao.inicio).data)}`}
        voltar={`/agenda/${id}`}
      />

      {realizar && (
        <p className="mb-4 text-sm text-muted">
          Quantos cartuchos, agulhas e biqueiras você usou? Eles saem do estoque automaticamente.
        </p>
      )}

      {grupos.length === 0 ? (
        <div className="flex flex-col gap-4">
          <div className="card flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted">
              Nenhum cartucho, agulha ou biqueira com quantidade no estoque.
            </p>
            <Link href="/estoque" className="botao-secundario">
              Ir para o estoque
            </Link>
          </div>
          {realizar && (
            <form action={acaoPular} className="flex justify-end">
              <button type="submit" className="botao">
                Concluir sessão
              </button>
            </form>
          )}
        </div>
      ) : (
        <MateriaisForm sessaoId={id} realizar={realizar} grupos={grupos} usados={usados} acaoPular={acaoPular} />
      )}
    </>
  );
}
