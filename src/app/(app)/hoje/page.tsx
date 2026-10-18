import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  FileSignature,
  HeartPulse,
  MessageCircle,
  Package,
  Plus,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hoje, linkLembrete, nomeDoDia, paraInstante, partesLocais, somarDias } from "@/lib/agenda";
import { alertas, type Anamnese } from "@/lib/anamnese";
import { reais, saldoSessao, somar } from "@/lib/financeiro";
import { acabando, type ItemEstoque } from "@/lib/estoque";
import { Topo } from "@/components/topo";
import { BotaoFlutuante } from "@/components/botao-flutuante";
import { CardSessao, type SessaoDoCard } from "@/components/card-sessao";

type SessaoDoDia = SessaoDoCard & {
  tatuagem_id: string;
  tatuagem: SessaoDoCard["tatuagem"] & {
    termos: { id: string } | { id: string }[] | null;
    cliente: { id: string; nome: string; telefone: string | null; anamneses: Anamnese | Anamnese[] | null };
  };
};

const SELECT =
  "id, tatuagem_id, inicio, fim, status, valor, pagamentos(valor), " +
  "tatuagem:tatuagens!inner(descricao, termos(id), " +
  "cliente:clientes!inner(id, nome, telefone, anamneses(*)))";

// O Supabase devolve relações 1:1 como objeto ou lista, conforme a relação.
function um<T>(valor: T | T[] | null): T | null {
  return Array.isArray(valor) ? (valor[0] ?? null) : valor;
}

type Pendencia = { chave: string; href: string; Icone: LucideIcon; texto: string; detalhe: string; cor: string };

function pendenciasDa(s: SessaoDoDia): Pendencia[] {
  if (s.status !== "agendado" && s.status !== "confirmado") return [];
  const hora = partesLocais(s.inicio).hora;
  const { cliente } = s.tatuagem;
  const detalhe = `${cliente.nome} · ${hora}`;
  const anamnese = um(cliente.anamneses);
  const lista: Pendencia[] = [];

  const atencao = anamnese ? alertas(anamnese) : [];
  if (atencao.length > 0) {
    lista.push({
      chave: `alerta-${s.id}`,
      href: `/agenda/${s.id}`,
      Icone: TriangleAlert,
      texto: `Atenção na anamnese: ${atencao.join(", ")}`,
      detalhe,
      cor: "text-red-600 dark:text-red-400",
    });
  }
  if (!anamnese) {
    lista.push({
      chave: `anamnese-${s.id}`,
      href: `/clientes/${cliente.id}/editar#anamnese`,
      Icone: HeartPulse,
      texto: "Preencher anamnese",
      detalhe,
      cor: "text-amber-600 dark:text-amber-400",
    });
  }
  if (!um(s.tatuagem.termos)) {
    lista.push({
      chave: `termo-${s.id}`,
      href: `/tatuagens/${s.tatuagem_id}/termo?de=/agenda/${s.id}`,
      Icone: FileSignature,
      texto: "Coletar assinatura do termo",
      detalhe,
      cor: "text-amber-600 dark:text-amber-400",
    });
  }
  if (s.status === "agendado") {
    lista.push({
      chave: `sinal-${s.id}`,
      href: `/agenda/${s.id}/pagamento`,
      Icone: Wallet,
      texto: "Sinal não registrado",
      detalhe,
      cor: "text-amber-600 dark:text-amber-400",
    });
  }
  if (s.valor === null) {
    lista.push({
      chave: `valor-${s.id}`,
      href: `/agenda/${s.id}/editar`,
      Icone: Wallet,
      texto: "Definir o valor da sessão",
      detalhe,
      cor: "text-muted",
    });
  }
  return lista;
}

export default async function HojePage() {
  const dia = hoje();
  const amanha = somarDias(dia, 1);

  const supabase = await createClient();
  const [{ data, error }, { data: estoque }] = await Promise.all([
    supabase
      .from("sessoes")
      .select(SELECT)
      .gte("inicio", paraInstante(dia, "00:00"))
      .lt("inicio", paraInstante(somarDias(dia, 2), "00:00"))
      .order("inicio"),
    supabase
      .from("itens_estoque")
      .select("id, nome, quantidade, unidade, estoque_minimo")
      .gt("estoque_minimo", 0)
      .order("nome"),
  ]);
  const sessoes = (data ?? []) as unknown as SessaoDoDia[];

  const deHoje = sessoes.filter((s) => partesLocais(s.inicio).data === dia);
  const deAmanha = sessoes.filter(
    (s) => partesLocais(s.inicio).data === amanha && (s.status === "agendado" || s.status === "confirmado"),
  );
  const ativasHoje = deHoje.filter((s) => s.status !== "cancelado");
  const aReceberHoje = somar(deHoje.map((s) => saldoSessao(s).falta));
  const pendencias = deHoje.flatMap(pendenciasDa);
  for (const item of ((estoque ?? []) as ItemEstoque[]).filter(acabando)) {
    pendencias.push({
      chave: `estoque-${item.id}`,
      href: `/estoque/${item.id}`,
      Icone: Package,
      texto: `Acabando: ${item.nome}`,
      detalhe: `${item.quantidade} ${item.unidade} · mínimo ${item.estoque_minimo}`,
      cor: "text-amber-600 dark:text-amber-400",
    });
  }

  return (
    <>
      <Topo titulo="Hoje" subtitulo={nomeDoDia(dia)} />

      <div className="flex flex-col gap-4">
        {error && <p className="aviso-erro">Erro ao carregar o dia.</p>}

        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs text-muted">Sessões hoje</p>
            <p className="text-xl font-semibold tabular-nums">{ativasHoje.length}</p>
          </div>
          <div className="card">
            <p className="text-xs text-muted">A receber hoje</p>
            <p className="text-xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
              {reais(aReceberHoje)}
            </p>
          </div>
        </div>

        {pendencias.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Pendências ({pendencias.length})
            </h2>
            <ul className="card divide-y divide-border p-0">
              {pendencias.map((p) => (
                <li key={p.chave}>
                  <Link href={p.href} className="flex items-center gap-3 px-4 py-3 active:bg-background">
                    <p.Icone className={`size-5 shrink-0 ${p.cor}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{p.texto}</span>
                      <span className="block truncate text-xs text-muted">{p.detalhe}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Sessões de hoje</h2>
          {deHoje.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-muted">Nenhuma sessão hoje</p>
              <Link href={`/agenda/nova?data=${dia}`} className="botao-secundario gap-2">
                <Plus className="size-4" />
                Agendar para hoje
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {deHoje.map((s) => (
                <li key={s.id}>
                  <CardSessao sessao={s} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Amanhã · lembretes
          </h2>
          {deAmanha.length === 0 ? (
            <div className="card py-6 text-center text-sm text-muted">Nenhuma sessão amanhã.</div>
          ) : (
            <ul className="card divide-y divide-border p-0">
              {deAmanha.map((s) => {
                const { cliente } = s.tatuagem;
                return (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <Link href={`/agenda/${s.id}`} className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{cliente.nome}</span>
                      <span className="block text-sm text-muted tabular-nums">
                        {partesLocais(s.inicio).hora} · {s.tatuagem.descricao}
                      </span>
                    </Link>
                    {cliente.telefone ? (
                      <a
                        href={linkLembrete(cliente.telefone, cliente.nome, s.inicio)}
                        target="_blank"
                        rel="noreferrer"
                        className="botao-secundario shrink-0 gap-2 py-1.5"
                      >
                        <MessageCircle className="size-4" />
                        Lembrar
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-muted">Sem telefone</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <BotaoFlutuante href={`/agenda/nova?data=${dia}`} rotulo="Nova sessão" />
    </>
  );
}
