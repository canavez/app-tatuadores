/**
 * Gráficos do relatório, em SVG puro (saem iguais na tela, no PDF e na imagem).
 * Cores validadas para o fundo escuro do app (inclusive para daltonismo):
 * recebido = violeta, custos = laranja. Textos sempre nas cores de texto, nunca na cor da série.
 */
import { reais } from "@/lib/financeiro";

export const COR_RECEBIDO = "#9085e9";
export const COR_CUSTOS = "#d95926";

/** 1500 → "1,5 mil"; 800 → "800" */
function compacto(valor: number): string {
  if (valor >= 1000) return `${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return String(Math.round(valor));
}

/** Teto "redondo" para o eixo: 3.870 → 4.000 */
function teto(maximo: number): number {
  if (maximo <= 0) return 1000;
  const ordem = 10 ** Math.floor(Math.log10(maximo));
  const passo = [1, 2, 2.5, 5, 10].find((p) => p * ordem >= maximo / 4)! * ordem;
  return Math.ceil(maximo / passo) * passo;
}

/** Coluna com o topo arredondado (4px) e a base reta. */
function coluna(x: number, y: number, largura: number, altura: number): string {
  if (altura <= 0) return "";
  const r = Math.min(4, altura, largura / 2);
  return `M${x},${y + altura}V${y + r}Q${x},${y} ${x + r},${y}H${x + largura - r}Q${x + largura},${y} ${x + largura},${y + r}V${y + altura}Z`;
}

export function Legenda({ itens }: { itens: { cor: string; rotulo: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted">
      {itens.map((i) => (
        <span key={i.rotulo} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: i.cor }} />
          {i.rotulo}
        </span>
      ))}
    </div>
  );
}

/** Colunas lado a lado: recebido x custos em cada período (semana ou mês). */
export function ColunasRecebidoCustos({
  pontos,
  titulo,
}: {
  pontos: { rotulo: string; recebido: number; custos: number }[];
  titulo: string;
}) {
  const L = 600;
  const A = 220;
  const margem = { esq: 44, dir: 8, topo: 10, base: 26 };
  const areaL = L - margem.esq - margem.dir;
  const areaA = A - margem.topo - margem.base;
  const max = teto(Math.max(...pontos.flatMap((p) => [p.recebido, p.custos])));
  const faixa = areaL / pontos.length;
  const barra = Math.min(24, (faixa - 12) / 2);
  const y = (v: number) => margem.topo + areaA - (v / max) * areaA;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);

  return (
    <svg viewBox={`0 0 ${L} ${A}`} role="img" aria-label={titulo} className="h-auto w-full">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={margem.esq} x2={L - margem.dir} y1={y(t)} y2={y(t)} stroke="#24243a" strokeWidth={1} />
          <text x={margem.esq - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#8e8ea8">
            {compacto(t)}
          </text>
        </g>
      ))}
      {pontos.map((p, i) => {
        const centro = margem.esq + faixa * i + faixa / 2;
        const xRec = centro - barra - 1;
        const xCus = centro + 1;
        return (
          <g key={p.rotulo}>
            <path d={coluna(xRec, y(p.recebido), barra, margem.topo + areaA - y(p.recebido))} fill={COR_RECEBIDO}>
              <title>{`${p.rotulo} · Recebido ${reais(p.recebido)}`}</title>
            </path>
            <path d={coluna(xCus, y(p.custos), barra, margem.topo + areaA - y(p.custos))} fill={COR_CUSTOS}>
              <title>{`${p.rotulo} · Custos ${reais(p.custos)}`}</title>
            </path>
            <text x={centro} y={A - 8} textAnchor="middle" fontSize={11} fill="#8e8ea8">
              {p.rotulo}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Barras horizontais de uma série só (nome à esquerda, valor na ponta). */
export function BarrasHorizontais({
  itens,
  total,
  titulo,
  cor = COR_RECEBIDO,
}: {
  itens: { rotulo: string; valor: number }[];
  total?: number;
  titulo: string;
  cor?: string;
}) {
  const max = Math.max(...itens.map((i) => i.valor), 1);
  return (
    <ul aria-label={titulo} className="flex flex-col gap-2.5">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{i.rotulo}</span>
            <span className="shrink-0 tabular-nums">
              {reais(i.valor)}
              {total ? (
                <span className="ml-1.5 text-xs text-muted">{Math.round((i.valor / total) * 100)}%</span>
              ) : null}
            </span>
          </div>
          <div className="h-2 rounded-full bg-border">
            <div className="h-full rounded-full" style={{ width: `${(i.valor / max) * 100}%`, background: cor }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
