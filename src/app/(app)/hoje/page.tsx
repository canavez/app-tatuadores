import Link from "next/link";
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
import { nomeDoUsuario } from "@/lib/usuario";
import { createClient } from "@/lib/supabase/server";
import {
  diaDaSemanaCurto,
  hoje,
  linkLembrete,
  nomeDoDia,
  paraInstante,
  partesLocais,
  somarDias,
} from "@/lib/agenda";
import { formatarData } from "@/lib/clientes";
import { alertas, type Anamnese } from "@/lib/anamnese";
import { reais, saldoSessao, somar } from "@/lib/financeiro";
import { acabando, type ItemEstoque } from "@/lib/estoque";
import { Topo } from "@/components/topo";
import { linkDaFoto } from "@/lib/fotos";
import { BotaoFlutuante } from "@/components/botao-flutuante";
import { CardSessao, type SessaoDoCard } from "@/components/card-sessao";
import { ProximaSessao, type Pendencia } from "./proxima-sessao";
import { ConviteLembretes } from "@/components/controle-lembretes";

type SessaoDoDia = SessaoDoCard & {
  tatuagem_id: string;
  tatuagem: SessaoDoCard["tatuagem"] & {
    termos: { id: string } | { id: string }[] | null;
    cliente: { id: string; nome: string; telefone: string | null; foto: string | null; anamneses: Anamnese | Anamnese[] | null };
  };
};

const SELECT =
  "id, tatuagem_id, inicio, fim, status, valor, pagamentos(valor), " +
  "tatuagem:tatuagens!inner(descricao, termos(id), " +
  "cliente:clientes!inner(id, nome, telefone, foto, anamneses(*)))";

// O Supabase devolve relações 1:1 como objeto ou lista, conforme a relação.
function um<T>(valor: T | T[] | null): T | null {
  return Array.isArray(valor) ? (valor[0] ?? null) : valor;
}

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

/** "Bom dia" / "Boa tarde" / "Boa noite" no horário de Brasília. */
function saudacao(): string {
  const hora = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCHours();
  return hora >= 5 && hora < 12 ? "Bom dia" : hora >= 12 && hora < 18 ? "Boa tarde" : "Boa noite";
}

/** Quando é a sessão, do jeito que se fala: "até 17:00", "Hoje às 14:00 · em 2 h", "Amanhã às 10:00". */
function quando(s: SessaoDoDia, dia: string): string {
  const agora = Date.now();
  const inicio = new Date(s.inicio).getTime();
  const { data, hora } = partesLocais(s.inicio);
  if (inicio <= agora) return `até ${partesLocais(s.fim).hora}`;
  if (data === dia) {
    const minutos = Math.round((inicio - agora) / 60_000);
    return `Hoje às ${hora} · ${minutos < 60 ? `em ${minutos} min` : `em ${Math.round(minutos / 60)} h`}`;
  }
  if (data === somarDias(dia, 1)) return `Amanhã às ${hora}`;
  const semana = diaDaSemanaCurto(data).replace(/^./, (c) => c.toUpperCase());
  return `${semana}, ${formatarData(data).slice(0, 5)} às ${hora}`;
}

const ativa = (s: { status: string }) => s.status === "agendado" || s.status === "confirmado";

export default async function HojePage() {
  const dia = hoje();
  const amanha = somarDias(dia, 1);
  const agora = new Date().toISOString();

  const supabase = await createClient();
  const [{ data, error }, { data: estoque }, { data: maisAdiante }, usuario] = await Promise.all([
    // Hoje e os próximos 7 dias.
    supabase
      .from("sessoes")
      .select(SELECT)
      .gte("inicio", paraInstante(dia, "00:00"))
      .lt("inicio", paraInstante(somarDias(dia, 7), "00:00"))
      .order("inicio"),
    supabase
      .from("itens_estoque")
      .select("id, nome, quantidade, unidade, estoque_minimo")
      .gt("estoque_minimo", 0)
      .order("nome"),
    // Se não houver nada na semana, a próxima sessão mais adiante.
    supabase
      .from("sessoes")
      .select(SELECT)
      .gte("inicio", paraInstante(somarDias(dia, 7), "00:00"))
      .in("status", ["agendado", "confirmado"])
      .order("inicio")
      .limit(1),
    supabase.auth.getUser(),
  ]);
  const sessoes = (data ?? []) as unknown as SessaoDoDia[];
  const primeiroNome = nomeDoUsuario(usuario.data.user).split(" ")[0];

  const deHoje = sessoes.filter((s) => partesLocais(s.inicio).data === dia);
  const ativasHoje = deHoje.filter((s) => s.status !== "cancelado");
  // A que está acontecendo agora ou a próxima que ainda vai começar.
  const proxima =
    sessoes.find((s) => ativa(s) && s.fim > agora) ?? ((maisAdiante ?? []) as unknown as SessaoDoDia[])[0] ?? null;
  const deAmanha = sessoes.filter((s) => partesLocais(s.inicio).data === amanha && ativa(s) && s.id !== proxima?.id);
  const daSemana = sessoes.filter((s) => s.status !== "cancelado" && s.status !== "faltou");
  const aReceberSemana = somar(daSemana.map((s) => saldoSessao(s).falta));

  // As pendências da próxima sessão aparecem no destaque dela; aqui ficam as outras de hoje.
  const pendencias = deHoje.filter((s) => s.id !== proxima?.id).flatMap(pendenciasDa);
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

  const resumoDia =
    ativasHoje.length === 0 ? "dia livre" : `${ativasHoje.length} ${ativasHoje.length === 1 ? "sessão" : "sessões"}`;

  return (
    <>
      <Topo
        titulo={primeiroNome ? `${saudacao()}, ${primeiroNome}` : saudacao()}
        subtitulo={`${nomeDoDia(dia)} · ${resumoDia}`}
      />

      <div className="flex flex-col gap-5">
        {error && <p className="aviso-erro">Erro ao carregar o dia.</p>}

        <ConviteLembretes />

        {proxima ? (
          <ProximaSessao
            sessao={proxima}
            quando={quando(proxima, dia)}
            agoraMesmo={proxima.inicio <= agora}
            pendencias={pendenciasDa(proxima)}
            fotoUrl={await linkDaFoto(proxima.tatuagem.cliente.foto)}
          />
        ) : (
          <div className="card flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted">Nenhuma sessão marcada pela frente.</p>
            <Link href={`/agenda/nova?data=${dia}`} className="botao-secundario gap-2">
              <Plus className="size-4" />
              Agendar sessão
            </Link>
          </div>
        )}

        {pendencias.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Pendências</h2>
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

        {deHoje.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Sessões de hoje</h2>
            <ul className="flex flex-col gap-2">
              {deHoje.map((s) => (
                <li key={s.id}>
                  <CardSessao sessao={s} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {deAmanha.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Amanhã · lembretes</h2>
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
          </section>
        )}

        {daSemana.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Próximos 7 dias</h2>
            <Link href="/agenda" className="card flex items-center justify-between gap-3 py-3 text-sm">
              <span>
                <span className="font-semibold tabular-nums">{daSemana.length}</span>{" "}
                <span className="text-muted">{daSemana.length === 1 ? "sessão" : "sessões"}</span>
              </span>
              <span>
                <span className="font-semibold tabular-nums">{reais(aReceberSemana)}</span>{" "}
                <span className="text-muted">a receber</span>
              </span>
            </Link>
          </section>
        )}
      </div>

      <BotaoFlutuante href={`/agenda/nova?data=${dia}`} rotulo="Nova sessão" />
    </>
  );
}
