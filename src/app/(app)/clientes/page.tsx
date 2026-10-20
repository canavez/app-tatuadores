import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatarData, type Cliente } from "@/lib/clientes";
import { diaDaSemanaCurto, partesLocais } from "@/lib/agenda";
import { Avatar } from "@/components/avatar";
import { linksDasFotos } from "@/lib/fotos";
import { Topo } from "@/components/topo";
import { BotaoFlutuante } from "@/components/botao-flutuante";

export default async function ClientesPage({ searchParams }: PageProps<"/clientes">) {
  const { q } = await searchParams;
  // Remove caracteres que quebrariam o filtro .or() do Supabase.
  const busca = typeof q === "string" ? q.replace(/[,()%]/g, "").trim() : "";

  const supabase = await createClient();
  let consulta = supabase.from("clientes").select("id, nome, telefone, instagram, foto").order("nome");
  if (busca) {
    consulta = consulta.or(
      `nome.ilike.%${busca}%,telefone.ilike.%${busca}%,instagram.ilike.%${busca}%`,
    );
  }
  const [{ data, error }, { data: sessoesData }] = await Promise.all([
    consulta,
    supabase
      .from("sessoes")
      .select(
        "inicio, status, tatuagem:tatuagens!inner(cliente_id, termos(id), cliente:clientes!inner(anamneses(cliente_id)))",
      )
      .neq("status", "cancelado")
      .order("inicio"),
  ]);
  const clientes = (data ?? []) as Pick<Cliente, "id" | "nome" | "telefone" | "instagram" | "foto">[];
  const fotos = await linksDasFotos(clientes.map((c) => c.foto));

  // Próxima e última sessão de cada cliente, e o que falta para a próxima.
  type SessaoResumo = {
    inicio: string;
    status: string;
    tatuagem: {
      cliente_id: string;
      termos: unknown;
      cliente: { anamneses: unknown };
    };
  };
  const agora = new Date().toISOString();
  const proxima = new Map<string, SessaoResumo>();
  const ultima = new Map<string, SessaoResumo>();
  for (const s of (sessoesData ?? []) as unknown as SessaoResumo[]) {
    const id = s.tatuagem.cliente_id;
    const ativa = s.status === "agendado" || s.status === "confirmado";
    if (s.inicio >= agora && ativa) {
      if (!proxima.has(id)) proxima.set(id, s);
    } else if (s.inicio < agora) {
      ultima.set(id, s);
    }
  }
  const vazio = (v: unknown) => v === null || (Array.isArray(v) && v.length === 0);
  const pendencia = (s: SessaoResumo) =>
    vazio(s.tatuagem.termos) ? "Termo" : vazio(s.tatuagem.cliente.anamneses) ? "Anamnese" : null;
  const curto = (instante: string) => {
    const { data, hora } = partesLocais(instante);
    return `${diaDaSemanaCurto(data)}, ${formatarData(data).slice(0, 5)} · ${hora}`;
  };

  return (
    <>
      <Topo
        titulo="Clientes"
        acoes={
          clientes.length > 0 && (
            <span className="text-sm text-muted">
              {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
            </span>
          )
        }
      />

      <form role="search" className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          name="q"
          defaultValue={busca}
          aria-label="Buscar clientes"
          placeholder="Buscar por nome, telefone ou Instagram"
          className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 outline-none placeholder:text-muted/70 focus:border-accent"
        />
      </form>

      {error && <p className="aviso-erro">Erro ao carregar clientes.</p>}

      {!error && clientes.length === 0 && (
        <div className="card flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-muted">
            {busca ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
          </p>
          {!busca && (
            <Link href="/clientes/novo" className="botao-secundario">
              Cadastrar o primeiro
            </Link>
          )}
        </div>
      )}

      {clientes.length > 0 && (
        <ul className="card divide-y divide-border p-0">
          {clientes.map((c) => {
            const prox = proxima.get(c.id);
            const ult = ultima.get(c.id);
            const falta = prox ? pendencia(prox) : null;
            return (
            <li key={c.id}>
              <Link
                href={`/clientes/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 active:bg-background"
              >
                <Avatar nome={c.nome} foto={c.foto ? fotos.get(c.foto) : null} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.nome}</span>
                  {prox ? (
                    <span className="block truncate text-sm text-lavanda">Próxima: {curto(prox.inicio)}</span>
                  ) : (
                    <span className="block truncate text-sm text-muted">
                      {ult ? `Última sessão ${formatarData(partesLocais(ult.inicio).data).slice(0, 5)}` : "Nenhuma sessão ainda"}
                    </span>
                  )}
                </span>
                {falta && (
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                    {falta}
                  </span>
                )}
                <ChevronRight className="size-4 shrink-0 text-muted" />
              </Link>
            </li>
            );
          })}
        </ul>
      )}

      <BotaoFlutuante href="/clientes/novo" rotulo="Novo cliente" />
    </>
  );
}
