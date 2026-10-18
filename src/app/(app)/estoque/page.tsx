import Link from "next/link";
import { Minus, Plus, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS_ESTOQUE, acabando, type ItemEstoque } from "@/lib/estoque";
import { BotaoIcone, Topo } from "@/components/topo";
import { ajustarQuantidade } from "./actions";

export default async function EstoquePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itens_estoque")
    .select("id, nome, categoria, quantidade, unidade, estoque_minimo")
    .order("nome");
  const itens = (data ?? []) as ItemEstoque[];
  const faltando = itens.filter(acabando);

  const grupos = Object.entries(CATEGORIAS_ESTOQUE)
    .map(([categoria, rotulo]) => ({ rotulo, itens: itens.filter((i) => i.categoria === categoria) }))
    .filter((g) => g.itens.length > 0);

  return (
    <>
      <Topo
        titulo="Estoque"
        acoes={
          <BotaoIcone href="/estoque/adicionar" rotulo="Adicionar itens">
            <Plus className="size-5" />
          </BotaoIcone>
        }
      />

      <div className="flex flex-col gap-4">
        {error && <p className="aviso-erro">Erro ao carregar o estoque.</p>}

        {itens.length === 0 && !error && (
          <div className="card flex flex-col items-center gap-3 py-10 text-center">
            <p className="font-medium">Monte seu estoque</p>
            <p className="max-w-xs text-sm text-muted">
              Escolha numa lista pronta os materiais que você usa: cartuchos, agulhas, luvas, batoques e mais.
            </p>
            <Link href="/estoque/adicionar" className="botao gap-2">
              <Plus className="size-4" />
              Escolher itens
            </Link>
          </div>
        )}

        {faltando.length > 0 && (
          <section
            aria-label="Acabando"
            className="card flex flex-col gap-2 border-amber-500/40 bg-amber-500/5"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
              <TriangleAlert className="size-4" />
              Acabando ({faltando.length})
            </p>
            <p className="text-sm">{faltando.map((i) => `${i.nome} (${i.quantidade})`).join(" · ")}</p>
          </section>
        )}

        {grupos.map((g) => (
          <section key={g.rotulo} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{g.rotulo}</h2>
            <ul className="card divide-y divide-border p-0">
              {g.itens.map((item) => {
                const pouco = acabando(item);
                return (
                  <li key={item.id} className="flex items-center gap-2 px-4 py-2">
                    <Link href={`/estoque/${item.id}`} className="min-w-0 flex-1 py-1">
                      <span className="block truncate">{item.nome}</span>
                      {item.estoque_minimo > 0 && (
                        <span className="block text-xs text-muted">mínimo {item.estoque_minimo}</span>
                      )}
                    </Link>
                    <form action={ajustarQuantidade.bind(null, item.id, -1)}>
                      <button
                        type="submit"
                        aria-label={`Tirar 1 de ${item.nome}`}
                        className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-background disabled:opacity-40"
                        disabled={item.quantidade === 0}
                      >
                        <Minus className="size-4" />
                      </button>
                    </form>
                    <span
                      className={`w-14 text-center font-semibold tabular-nums ${pouco ? "text-amber-700 dark:text-amber-400" : ""}`}
                      aria-label={`Quantidade de ${item.nome}`}
                    >
                      {item.quantidade}
                      <span className="ml-0.5 text-xs font-normal text-muted">{item.unidade}</span>
                    </span>
                    <form action={ajustarQuantidade.bind(null, item.id, 1)}>
                      <button
                        type="submit"
                        aria-label={`Somar 1 em ${item.nome}`}
                        className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-background"
                      >
                        <Plus className="size-4" />
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {itens.length > 0 && (
          <p className="text-center text-xs text-muted">
            Toque no nome de um item para mudar a quantidade de uma vez ou definir o estoque mínimo.
          </p>
        )}
      </div>
    </>
  );
}
