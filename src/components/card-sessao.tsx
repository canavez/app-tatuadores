import Link from "next/link";
import { STATUS, partesLocais, type StatusSessao } from "@/lib/agenda";
import { reais, saldoSessao } from "@/lib/financeiro";

// Cor da barrinha lateral de cada sessão, conforme o status.
const BARRA: Record<StatusSessao, string> = {
  agendado: "bg-amber-500",
  confirmado: "bg-blue-500",
  realizado: "bg-green-500",
  faltou: "bg-red-500",
  cancelado: "bg-zinc-400",
};

export type SessaoDoCard = {
  id: string;
  inicio: string;
  fim: string;
  status: StatusSessao;
  valor: number | null;
  pagamentos: { valor: number }[];
  tatuagem: { descricao: string; cliente: { nome: string } };
};

/** Card de uma sessão na lista do dia: horário, cliente, tatuagem, status e valor. */
export function CardSessao({ sessao: s }: { sessao: SessaoDoCard }) {
  return (
    <Link
      href={`/agenda/${s.id}`}
      className={`card flex items-stretch gap-3 p-3 transition active:scale-[0.99] ${
        s.status === "cancelado" ? "opacity-60" : ""
      }`}
    >
      <span className={`w-1 shrink-0 rounded-full ${BARRA[s.status]}`} />
      <span className="flex w-12 shrink-0 flex-col justify-center font-mono text-sm tabular-nums">
        <span className="font-semibold">{partesLocais(s.inicio).hora}</span>
        <span className="text-muted">{partesLocais(s.fim).hora}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="truncate font-medium">{s.tatuagem.cliente.nome}</span>
        <span className="truncate text-sm text-muted">{s.tatuagem.descricao}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end justify-center gap-1">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS[s.status].cor}`}>
          {STATUS[s.status].rotulo}
        </span>
        <ValorDaSessao sessao={s} />
      </span>
    </Link>
  );
}

/** Valor da sessão: âmbar enquanto falta receber, verde quando quitado. */
function ValorDaSessao({ sessao }: { sessao: SessaoDoCard }) {
  if (sessao.valor === null) return <span className="text-xs text-muted">Sem valor</span>;
  const { pago, falta } = saldoSessao(sessao);
  return (
    <span
      className={`text-xs font-medium tabular-nums ${falta ? "text-amber-700 dark:text-amber-400" : "text-green-700 dark:text-green-400"}`}
      title={falta ? `${reais(pago)} pago · falta ${reais(falta)}` : "Quitado"}
    >
      {reais(Number(sessao.valor))}
    </span>
  );
}
