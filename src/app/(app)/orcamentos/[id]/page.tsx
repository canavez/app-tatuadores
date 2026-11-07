import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArchiveRestore, UserPlus, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { linksDasFotos } from "@/lib/fotos";
import { nomeDoUsuario } from "@/lib/usuario";
import { formatarTelefone, linkResposta, quandoChegou, type Orcamento } from "@/lib/orcamentos";
import { Topo } from "@/components/topo";
import { BotaoExcluir } from "@/components/botao-excluir";
import { BotaoWhatsApp } from "../botao-whatsapp";
import { excluirOrcamento, mudarStatus, virarCliente } from "../actions";

export default async function OrcamentoPage({ params, searchParams }: PageProps<"/orcamentos/[id]">) {
  const { id } = await params;
  const { erro } = await searchParams;
  const supabase = await createClient();
  const [{ data }, usuario] = await Promise.all([
    supabase
      .from("orcamentos")
      .select("id, nome, telefone, descricao, local_corpo, imagens, status, cliente_id, criado_em")
      .eq("id", id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (!data) notFound();
  const o = data as Orcamento;
  const links = await linksDasFotos(o.imagens);
  const quando = new Date(o.criado_em).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <>
      <Topo titulo={o.nome} voltar="/orcamentos" subtitulo={`Orçamento · ${quandoChegou(o.criado_em)}`} />

      <div className="flex flex-col gap-5">
        {erro === "cliente" && <p className="aviso-erro">Não foi possível cadastrar o cliente. Tente novamente.</p>}

        <BotaoWhatsApp id={o.id} href={linkResposta(o, nomeDoUsuario(usuario.data.user))} grande />

        <section className="card flex flex-col gap-4">
          <div>
            <p className="text-xs text-muted">Ideia</p>
            <p className="mt-1 whitespace-pre-line">{o.descricao}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Lugar do corpo</dt>
              <dd>{o.local_corpo ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Celular</dt>
              <dd className="tabular-nums">{formatarTelefone(o.telefone)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Recebido em</dt>
              <dd className="tabular-nums">{quando}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Situação</dt>
              <dd>{o.status === "novo" ? "Novo" : o.status === "respondido" ? "Respondido" : "Arquivado"}</dd>
            </div>
          </dl>
        </section>

        {o.imagens.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Referências</h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {o.imagens.map((caminho, i) => {
                const link = links.get(caminho);
                return (
                  <li key={caminho}>
                    {link ? (
                      <a href={link} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={link}
                          alt={`Referência ${i + 1}`}
                          className="aspect-square w-full rounded-xl border border-border object-cover"
                        />
                      </a>
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-xl border border-border text-xs text-muted">
                        Imagem indisponível
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-2">
          {o.cliente_id ? (
            <Link href={`/clientes/${o.cliente_id}`} className="botao-secundario gap-2 py-3">
              <UserRound className="size-4" />
              Ver cliente
            </Link>
          ) : (
            <form action={virarCliente.bind(null, o.id)}>
              <button type="submit" className="botao-secundario w-full gap-2 py-3">
                <UserPlus className="size-4" />
                Cadastrar como cliente
              </button>
            </form>
          )}
          <form action={mudarStatus.bind(null, o.id, o.status === "arquivado" ? "respondido" : "arquivado")}>
            <button type="submit" className="botao-secundario w-full gap-2 py-3">
              {o.status === "arquivado" ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
              {o.status === "arquivado" ? "Desarquivar" : "Arquivar"}
            </button>
          </form>
        </section>

        <div className="flex justify-center">
          <BotaoExcluir
            acao={excluirOrcamento.bind(null, o.id)}
            rotulo="Excluir orçamento"
            confirmacao="Excluir este orçamento e as imagens de referência? Não tem como desfazer."
          />
        </div>
      </div>
    </>
  );
}
