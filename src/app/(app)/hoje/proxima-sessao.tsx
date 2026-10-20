import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Clock, MessageCircle } from "lucide-react";
import { linkLembrete } from "@/lib/agenda";
import { reais } from "@/lib/financeiro";
import { Avatar } from "@/components/avatar";

export type Pendencia = {
  chave: string;
  href: string;
  Icone: LucideIcon;
  texto: string;
  detalhe: string;
  cor: string;
};

type Props = {
  sessao: {
    id: string;
    inicio: string;
    valor: number | null;
    tatuagem: { descricao: string; cliente: { nome: string; telefone: string | null } };
  };
  /** "Hoje às 14:00 · em 2 h", "Amanhã às 10:00"... */
  quando: string;
  agoraMesmo: boolean;
  pendencias: Pendencia[];
};

/** Destaque da próxima sessão na tela Hoje: quando, quem, o que falta e atalhos. */
export function ProximaSessao({ sessao: s, quando, agoraMesmo, pendencias }: Props) {
  const { cliente } = s.tatuagem;
  return (
    <section
      aria-label="Próxima sessão"
      className="flex flex-col gap-3 rounded-2xl border border-accent/30 bg-surface-alto/40 p-4"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-lavanda">
        <Clock className="size-3.5" />
        {agoraMesmo ? "Sessão agora" : "Próxima sessão"} · {quando}
      </p>
      <Link href={`/agenda/${s.id}`} className="flex items-center gap-3">
        <Avatar nome={cliente.nome} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold">{cliente.nome}</span>
          <span className="block truncate text-sm text-muted">{s.tatuagem.descricao}</span>
        </span>
        {s.valor !== null && <span className="shrink-0 font-semibold tabular-nums">{reais(Number(s.valor))}</span>}
      </Link>

      {pendencias.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {pendencias.map((p) => (
            <li key={p.chave}>
              <Link
                href={p.href}
                aria-label={`${p.texto} · ${p.detalhe}`}
                className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-300 active:opacity-80"
              >
                <p.Icone className="size-3.5" />
                {p.texto}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        {cliente.telefone && !agoraMesmo && (
          <a
            href={linkLembrete(cliente.telefone, cliente.nome, s.inicio)}
            target="_blank"
            rel="noreferrer"
            className="botao flex-1 gap-2 py-2.5"
          >
            <MessageCircle className="size-4" />
            Lembrar
          </a>
        )}
        <Link href={`/agenda/${s.id}`} className="botao-secundario flex-1 py-2.5">
          Abrir sessão
        </Link>
      </div>
    </section>
  );
}
