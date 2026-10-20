import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { hoje } from "@/lib/agenda";
import { formatarData } from "@/lib/clientes";
import { reais } from "@/lib/financeiro";
import { TIPOS_PERIODO, ehTipoPeriodo, mesCurto, montarPeriodo, somarMeses, type TipoPeriodo } from "@/lib/relatorio";
import { Topo } from "@/components/topo";
import { BarrasHorizontais, COR_CUSTOS, COR_RECEBIDO, ColunasRecebidoCustos, Legenda } from "@/components/graficos";
import { montarRelatorio } from "./dados";
import { Exportar } from "./exportar";

function Indicador({ rotulo, valor, detalhe, destaque }: { rotulo: string; valor: string; detalhe?: string; destaque?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-xs text-muted">{rotulo}</p>
      <p className={`text-lg font-semibold tabular-nums ${destaque ?? ""}`}>{valor}</p>
      {detalhe && <p className="text-xs text-muted">{detalhe}</p>}
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex break-inside-avoid flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function RelatorioPage({ searchParams }: PageProps<"/financeiro/relatorio">) {
  const { tipo: tipoParam, ref } = await searchParams;
  const tipo: TipoPeriodo = ehTipoPeriodo(tipoParam) ? tipoParam : "mes";
  const referencia = typeof ref === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(ref) ? ref : hoje().slice(0, 7);
  const periodo = montarPeriodo(tipo, referencia);
  const r = await montarRelatorio(periodo);
  const tamanho = TIPOS_PERIODO[tipo].meses;
  const url = (t: TipoPeriodo, mes: string) => `/financeiro/relatorio?tipo=${t}&ref=${mes}`;
  const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

  return (
    <>
      <div className="print:hidden">
        <Topo titulo="Relatório" voltar="/financeiro" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Controles (não saem no PDF nem na imagem) */}
        <div className="flex flex-col gap-3 print:hidden">
          <nav aria-label="Tipo de período" className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-surface p-1 text-sm">
            {(Object.keys(TIPOS_PERIODO) as TipoPeriodo[]).map((t) => (
              <Link
                key={t}
                href={url(t, periodo.inicio)}
                aria-current={t === tipo ? "page" : undefined}
                className={`rounded-lg py-2 text-center ${t === tipo ? "bg-surface-alto font-medium text-lavanda" : "text-muted"}`}
              >
                {TIPOS_PERIODO[t].rotulo}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-between">
            <Link href={url(tipo, somarMeses(periodo.inicio, -tamanho))} aria-label="Período anterior" className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface">
              <ChevronLeft className="size-5" />
            </Link>
            <span className="text-sm font-medium">{periodo.nome}</span>
            <Link href={url(tipo, somarMeses(periodo.inicio, tamanho))} aria-label="Próximo período" className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface">
              <ChevronRight className="size-5" />
            </Link>
          </div>
          <Exportar nomeArquivo={`ravenn-relatorio-${tipo}-${periodo.inicio}`} />
        </div>

        {r.erro && <p className="aviso-erro">Erro ao carregar os dados do relatório.</p>}

        {/* O relatório em si */}
        <article id="relatorio" className="relatorio flex flex-col gap-4 bg-background p-1 print:p-[10mm]">
          <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <Image src="/logo.png" alt="Ravenn" width={640} height={203} className="h-8 w-auto" />
              <p className="mt-3 text-xs uppercase tracking-wide text-muted">Relatório financeiro</p>
              <h1 className="text-xl font-semibold">{periodo.nome}</h1>
            </div>
            <div className="text-right text-xs text-muted">
              {r.nomeTatuador && <p className="text-sm text-foreground">{r.nomeTatuador}</p>}
              <p>
                Gerado em {formatarData(r.geradoEm.data)} às {r.geradoEm.hora}
              </p>
            </div>
          </header>

          {/* Lucro em destaque */}
          <section className="flex break-inside-avoid flex-col gap-1 rounded-2xl border border-accent/30 bg-surface-alto/40 p-4">
            <p className="text-xs font-medium text-lavanda">Lucro do período</p>
            <p className={`text-3xl font-semibold tabular-nums ${r.lucro < 0 ? "text-red-400" : "text-green-400"}`}>
              {reais(r.lucro)}
            </p>
            <p className="text-sm text-muted tabular-nums">
              {reais(r.recebido)} recebido − {reais(r.custos)} de custos · margem de {pct(r.margem)}
            </p>
          </section>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Indicador rotulo="Recebido" valor={reais(r.recebido)} detalhe={r.sinais > 0 ? `${reais(r.sinais)} em sinais` : undefined} />
            <Indicador rotulo="Custos" valor={reais(r.custos)} detalhe={r.recebido > 0 ? `${pct((r.custos / r.recebido) * 100)} do recebido` : undefined} />
            <Indicador rotulo="Sessões realizadas" valor={String(r.contagem.realizadas)} detalhe={`ticket médio ${reais(r.ticketMedio)}`} />
            <Indicador rotulo="A receber hoje" valor={reais(r.aReceber)} detalhe="de todas as sessões" destaque="text-amber-400" />
          </div>

          <Bloco titulo={tipo === "mes" ? "Recebido e custos por semana" : "Recebido e custos por mês"}>
            <Legenda itens={[{ cor: COR_RECEBIDO, rotulo: "Recebido" }, { cor: COR_CUSTOS, rotulo: "Custos" }]} />
            <ColunasRecebidoCustos pontos={r.serie} titulo="Recebido e custos" />
            {tipo === "mes" && (
              <p className="text-xs text-muted">
                Por semana entram taxas e despesas; {r.proprio ? "as contas fixas" : "a comissão do estúdio"} conta só no total do mês.
              </p>
            )}
          </Bloco>

          <div className="grid gap-4 sm:grid-cols-2">
            <Bloco titulo="Recebido por forma de pagamento">
              {r.porForma.length ? (
                <BarrasHorizontais itens={r.porForma} total={r.recebido} titulo="Recebido por forma de pagamento" />
              ) : (
                <p className="text-sm text-muted">Nenhum recebimento no período.</p>
              )}
            </Bloco>
            <Bloco titulo="Para onde foi o dinheiro">
              {r.custosPorTipo.length ? (
                <BarrasHorizontais itens={r.custosPorTipo} total={r.custos} titulo="Custos por tipo" cor={COR_CUSTOS} />
              ) : (
                <p className="text-sm text-muted">Nenhum custo no período.</p>
              )}
            </Bloco>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Bloco titulo="Clientes que mais pagaram">
              {r.topClientes.length ? (
                <BarrasHorizontais itens={r.topClientes} total={r.recebido} titulo="Clientes que mais pagaram" />
              ) : (
                <p className="text-sm text-muted">Nenhum recebimento no período.</p>
              )}
            </Bloco>
            <Bloco titulo="Sessões no período">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Realizadas", r.contagem.realizadas],
                  ["Marcadas", r.contagem.marcadas],
                  ["Faltas", r.contagem.faltas],
                  ["Canceladas", r.contagem.canceladas],
                ].map(([rotulo, n]) => (
                  <div key={rotulo} className="rounded-xl bg-background p-3">
                    <dt className="text-xs text-muted">{rotulo}</dt>
                    <dd className="text-lg font-semibold tabular-nums">{n}</dd>
                  </div>
                ))}
              </dl>
            </Bloco>
          </div>

          {/* Tabela (também é a versão em texto dos gráficos) */}
          <Bloco titulo={tamanho > 1 ? "Resumo mês a mês" : "Resumo do mês"}>
            <div>
              <table className="w-full text-sm tabular-nums">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="py-1.5 pr-2 font-medium">Mês</th>
                    <th className="py-1.5 pr-2 text-right font-medium">Recebido</th>
                    <th className="py-1.5 pr-2 text-right font-medium">Custos</th>
                    <th className="py-1.5 text-right font-medium">Lucro</th>
                  </tr>
                </thead>
                <tbody>
                  {r.porMes.map((m) => (
                    <tr key={m.mes} className="border-t border-border">
                      <td className="py-1.5 pr-2 capitalize">{mesCurto(m.mes)}</td>
                      <td className="py-1.5 pr-2 text-right">{reais(m.recebido)}</td>
                      <td className="py-1.5 pr-2 text-right text-muted">{reais(m.custos)}</td>
                      <td className={`py-1.5 text-right font-medium ${m.lucro < 0 ? "text-red-400" : ""}`}>{reais(m.lucro)}</td>
                    </tr>
                  ))}
                  {tamanho > 1 && (
                    <tr className="border-t border-border font-semibold">
                      <td className="py-1.5 pr-2">Total</td>
                      <td className="py-1.5 pr-2 text-right">{reais(r.recebido)}</td>
                      <td className="py-1.5 pr-2 text-right">{reais(r.custos)}</td>
                      <td className="py-1.5 text-right">{reais(r.lucro)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Bloco>

          <footer className="flex justify-between border-t border-border pt-3 text-xs text-muted">
            <span>Ravenn · agenda, clientes e financeiro do seu estúdio</span>
            <span>{periodo.nome}</span>
          </footer>
        </article>
      </div>
    </>
  );
}
