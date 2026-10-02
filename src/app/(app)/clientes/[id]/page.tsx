import Link from "next/link";
import { calcularIdade, formatarData, linkWhatsApp } from "@/lib/clientes";
import { STATUS, partesLocais, type Sessao, type Tatuagem } from "@/lib/agenda";
import { createClient } from "@/lib/supabase/server";
import { BotaoExcluir } from "@/components/botao-excluir";
import { excluirCliente } from "../actions";
import { ResumoAnamnese } from "@/components/resumo-anamnese";
import { buscarAnamnese, buscarCliente } from "./buscar-cliente";

export default async function ClientePage({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const [cliente, anamnese] = await Promise.all([buscarCliente(id), buscarAnamnese(id)]);
  const idade = calcularIdade(cliente.data_nascimento);

  const supabase = await createClient();
  const { data } = await supabase
    .from("tatuagens")
    .select("id, cliente_id, descricao, local_corpo, sessoes(id, inicio, status)")
    .eq("cliente_id", id)
    .order("criado_em", { ascending: false })
    .order("inicio", { referencedTable: "sessoes" });
  const tatuagens = (data ?? []) as (Tatuagem & {
    sessoes: Pick<Sessao, "id" | "inicio" | "status">[];
  })[];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/clientes" className="text-sm text-muted hover:text-foreground">
        ← Clientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{cliente.nome}</h1>
          {idade !== null && idade < 18 && (
            <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              Menor de idade — exige autorização do responsável
            </span>
          )}
        </div>
        <Link href={`/clientes/${cliente.id}/editar`} className="botao-secundario">
          Editar
        </Link>
      </div>

      <dl className="card grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Telefone">
          {cliente.telefone && (
            <a
              href={linkWhatsApp(cliente.telefone)}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {cliente.telefone}
            </a>
          )}
        </Campo>
        <Campo rotulo="Instagram">
          {cliente.instagram && (
            <a
              href={`https://instagram.com/${cliente.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              @{cliente.instagram}
            </a>
          )}
        </Campo>
        <Campo rotulo="E-mail">{cliente.email}</Campo>
        <Campo rotulo="Nascimento">
          {cliente.data_nascimento &&
            `${formatarData(cliente.data_nascimento)} (${idade} anos)`}
        </Campo>
        <Campo rotulo="CPF">{cliente.cpf}</Campo>
        <div className="sm:col-span-2">
          <Campo rotulo="Observações">
            {cliente.observacoes && (
              <span className="whitespace-pre-wrap">{cliente.observacoes}</span>
            )}
          </Campo>
        </div>
      </dl>

      <ResumoAnamnese clienteId={cliente.id} anamnese={anamnese} />

      <div className="mt-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Tatuagens</h2>
        <Link href={`/agenda/nova?cliente=${cliente.id}`} className="botao">
          + Agendar sessão
        </Link>
      </div>

      {tatuagens.length === 0 ? (
        <div className="card text-center text-sm text-muted">Nenhuma tatuagem ainda.</div>
      ) : (
        tatuagens.map((t) => (
          <section key={t.id} className="card p-0">
            <header className="border-b border-border px-4 py-2">
              <h3 className="font-medium">
                {t.descricao}
                {t.local_corpo && <span className="text-muted"> · {t.local_corpo}</span>}
              </h3>
            </header>
            <ul className="divide-y divide-border">
              {t.sessoes.map((s) => {
                const inicio = partesLocais(s.inicio);
                return (
                  <li key={s.id}>
                    <Link
                      href={`/agenda/${s.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm hover:bg-background"
                    >
                      <span className="tabular-nums">
                        {formatarData(inicio.data)} às {inicio.hora}
                      </span>
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[s.status].cor}`}
                      >
                        {STATUS[s.status].rotulo}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <div className="flex justify-end">
        <BotaoExcluir
          acao={excluirCliente.bind(null, cliente.id)}
          rotulo="Excluir cliente"
          confirmacao="Excluir este cliente? As tatuagens e sessões dele também serão apagadas. Essa ação não pode ser desfeita."
        />
      </div>
    </div>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{rotulo}</dt>
      <dd className="mt-1">{children || <span className="text-muted">—</span>}</dd>
    </div>
  );
}
