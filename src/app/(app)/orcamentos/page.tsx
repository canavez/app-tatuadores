import Link from "next/link";
import { ChevronRight, Images, Inbox, Settings, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { nomeDoUsuario } from "@/lib/usuario";
import { linkDaPagina, linkResposta, quandoChegou, type Orcamento } from "@/lib/orcamentos";
import { BotaoIcone, Topo } from "@/components/topo";
import { BotaoWhatsApp } from "./botao-whatsapp";
import { CompartilharLink } from "./compartilhar-link";
import { clientesDosOrcamentos } from "./clientes";

const FILTROS = [
  { valor: "abertos", rotulo: "Abertos" },
  { valor: "arquivados", rotulo: "Arquivados" },
] as const;

export default async function OrcamentosPage({ searchParams }: PageProps<"/orcamentos">) {
  const { ver } = await searchParams;
  const arquivados = ver === "arquivados";

  const supabase = await createClient();
  let consulta = supabase
    .from("orcamentos")
    .select("id, nome, telefone, descricao, local_corpo, imagens, status, cliente_id, criado_em")
    .order("criado_em", { ascending: false })
    .limit(200);
  consulta = arquivados ? consulta.eq("status", "arquivado") : consulta.neq("status", "arquivado");

  const [{ data, error }, { data: perfil }, usuario] = await Promise.all([
    consulta,
    supabase.from("perfis").select("slug, aceitando").maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const orcamentos = (data ?? []) as Orcamento[];
  const nome = perfil ? nomeDoUsuario(usuario.data.user) : "";
  const clientes = await clientesDosOrcamentos(orcamentos);
  const novos = orcamentos.filter((o) => o.status === "novo").length;

  return (
    <>
      <Topo
        titulo="Orçamentos"
        voltar="/hoje"
        subtitulo={novos > 0 ? `${novos} ${novos === 1 ? "novo" : "novos"}` : undefined}
        acoes={
          <BotaoIcone href="/conta/pagina" rotulo="Minha página">
            <Settings className="size-5" />
          </BotaoIcone>
        }
      />

      <div className="flex flex-col gap-5">
        {error && <p className="aviso-erro">Erro ao carregar os orçamentos.</p>}

        {perfil ? (
          <section className="card flex flex-col gap-2 py-4">
            <p className="text-xs text-muted">
              {perfil.aceitando
                ? "Sua página de orçamento. Coloque o link na bio do Instagram:"
                : "Sua página está pausada (não recebe pedidos):"}
            </p>
            <CompartilharLink link={linkDaPagina(perfil.slug)} />
          </section>
        ) : (
          <Link href="/conta/pagina" className="card flex flex-col gap-2 border-accent/40 text-sm">
            <span className="font-semibold">Crie sua página de orçamento</span>
            <span className="text-muted">
              Escolha seu link (ex.: ravenn.me/seunome). Os clientes mandam a ideia, o lugar do corpo e as referências, e
              o pedido chega aqui.
            </span>
            <span className="font-semibold text-lavanda">Criar minha página</span>
          </Link>
        )}

        <nav aria-label="Filtro" className="flex gap-2">
          {FILTROS.map((f) => {
            const ativo = (f.valor === "arquivados") === arquivados;
            return (
              <Link
                key={f.valor}
                href={f.valor === "abertos" ? "/orcamentos" : "/orcamentos?ver=arquivados"}
                aria-current={ativo ? "page" : undefined}
                className={`rounded-full px-3 py-1 text-sm ${ativo ? "bg-accent/15 font-medium text-lavanda" : "text-muted"}`}
              >
                {f.rotulo}
              </Link>
            );
          })}
        </nav>

        {orcamentos.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-10 text-center text-sm text-muted">
            <Inbox className="size-8" />
            {arquivados ? "Nenhum orçamento arquivado." : "Nenhum pedido de orçamento por enquanto."}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {orcamentos.map((o) => (
              <li key={o.id} className="card flex flex-col gap-3 p-4">
                <Link href={`/orcamentos/${o.id}`} className="flex items-start gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      {o.status === "novo" && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          Novo
                        </span>
                      )}
                      <span className="truncate font-semibold">{o.nome}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {quandoChegou(o.criado_em)}
                      {o.local_corpo && ` · ${o.local_corpo}`}
                    </span>
                    {clientes.has(o.id) && (
                      <span className="mt-1 flex items-center gap-1 text-xs text-lavanda">
                        <UserRound className="size-3.5" />
                        Já é seu cliente · {clientes.get(o.id)!.cliente.nome}
                      </span>
                    )}
                    <span className="mt-1.5 line-clamp-2 block text-sm">{o.descricao}</span>
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted" />
                </Link>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    {o.imagens.length > 0 && (
                      <>
                        <Images className="size-4" />
                        {o.imagens.length} {o.imagens.length === 1 ? "referência" : "referências"}
                      </>
                    )}
                    {o.status === "respondido" && <span>Respondido</span>}
                  </span>
                  <BotaoWhatsApp id={o.id} href={linkResposta(o, nome)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
