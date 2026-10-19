import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS_ESTOQUE, acabando, type CategoriaEstoque, type ItemEstoque } from "@/lib/estoque";
import { BotaoIcone, Topo } from "@/components/topo";
import { ajustarQuantidade } from "./actions";

// Dentro de "Cartuchos", "Cartucho 11RS" aparece só como "11RS" (idem agulhas e biqueiras).
const PREFIXO: Partial<Record<CategoriaEstoque, string>> = {
  cartuchos: "Cartucho ",
  agulhas: "Agulha ",
  biqueiras: "Biqueira ",
};

function nomeCurto(item: ItemEstoque): string {
  const prefixo = PREFIXO[item.categoria];
  return prefixo && item.nome.startsWith(prefixo) ? item.nome.slice(prefixo.length) : item.nome;
}

export default async function EstoquePage({ searchParams }: PageProps<"/estoque">) {
  const { filtro } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itens_estoque")
    .select("id, nome, categoria, quantidade, unidade, estoque_minimo")
    .order("nome");
  const todos = (data ?? []) as ItemEstoque[];
  const semEstoque = todos.filter((i) => i.quantidade === 0);
  const faltando = todos.filter((i) => i.quantidade > 0 && acabando(i));

  const itens =
    filtro === "sem"
      ? semEstoque
      : filtro === "acabando"
        ? faltando
        : typeof filtro === "string" && filtro in CATEGORIAS_ESTOQUE
          ? todos.filter((i) => i.categoria === filtro)
          : todos;

  const grupos = Object.entries(CATEGORIAS_ESTOQUE)
    .map(([categoria, rotulo]) => ({ rotulo, itens: itens.filter((i) => i.categoria === categoria) }))
    .filter((g) => g.itens.length > 0);

  const filtros: { valor: string | null; rotulo: string; cor?: string }[] = [
    { valor: null, rotulo: "Todos" },
    ...(faltando.length > 0 ? [{ valor: "acabando", rotulo: "Acabando", cor: "text-amber-300" }] : []),
    ...(semEstoque.length > 0 ? [{ valor: "sem", rotulo: "Sem estoque", cor: "text-red-300" }] : []),
    ...Object.entries(CATEGORIAS_ESTOQUE)
      .filter(([c]) => todos.some((i) => i.categoria === c))
      .map(([valor, rotulo]) => ({ valor, rotulo })),
  ];
  const ativo = typeof filtro === "string" ? filtro : null;

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

        {todos.length === 0 && !error && (
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

        {todos.length > 0 && (
          <>
            <p className="-mt-2 text-sm text-muted">
              {todos.length} {todos.length === 1 ? "item" : "itens"}
              {faltando.length > 0 && <span className="text-amber-400"> · {faltando.length} acabando</span>}
              {semEstoque.length > 0 && <span className="text-red-400"> · {semEstoque.length} sem estoque</span>}
            </p>

            <nav aria-label="Filtros do estoque" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filtros.map((f) => (
                <Link
                  key={f.rotulo}
                  href={f.valor ? `/estoque?filtro=${f.valor}` : "/estoque"}
                  aria-current={ativo === f.valor ? "page" : undefined}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${
                    ativo === f.valor
                      ? "border-accent/50 bg-surface-alto font-medium text-violet-200"
                      : `border-border ${f.cor ?? "text-muted"} hover:text-foreground`
                  }`}
                >
                  {f.rotulo}
                </Link>
              ))}
            </nav>
          </>
        )}

        {todos.length > 0 && grupos.length === 0 && (
          <div className="card py-8 text-center text-sm text-muted">Nenhum item neste filtro.</div>
        )}

        {grupos.map((g) => (
          <section key={g.rotulo} className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{g.rotulo}</h2>
            <ul className="card divide-y divide-border p-0">
              {g.itens.map((item) => {
                const zerado = item.quantidade === 0;
                const pouco = !zerado && acabando(item);
                return (
                  <li key={item.id} className="flex items-center gap-2 px-4 py-2">
                    <Link href={`/estoque/${item.id}`} className="min-w-0 flex-1 py-1" aria-label={item.nome}>
                      <span className="block leading-snug">{nomeCurto(item)}</span>
                      {zerado ? (
                        <span className="block text-xs text-red-400">Sem estoque</span>
                      ) : pouco ? (
                        <span className="block text-xs text-amber-400">
                          Acabando · mínimo {item.estoque_minimo}
                        </span>
                      ) : null}
                    </Link>
                    <form action={ajustarQuantidade.bind(null, item.id, -1)}>
                      <button
                        type="submit"
                        aria-label={`Tirar 1 de ${item.nome}`}
                        className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-background disabled:opacity-30"
                        disabled={zerado}
                      >
                        <Minus className="size-3.5" />
                      </button>
                    </form>
                    <span
                      className={`w-11 text-center font-semibold tabular-nums ${zerado ? "text-red-400" : pouco ? "text-amber-400" : ""}`}
                      aria-label={`Quantidade de ${item.nome}`}
                    >
                      {item.quantidade}
                      <span className="ml-0.5 text-[11px] font-normal text-muted">{item.unidade}</span>
                    </span>
                    <form action={ajustarQuantidade.bind(null, item.id, 1)}>
                      <button
                        type="submit"
                        aria-label={`Somar 1 em ${item.nome}`}
                        className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-background"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {todos.length > 0 && (
          <p className="text-center text-xs text-muted">
            Toque no nome de um item para mudar a quantidade de uma vez ou definir o estoque mínimo.
          </p>
        )}
      </div>
    </>
  );
}
