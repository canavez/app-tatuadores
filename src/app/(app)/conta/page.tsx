import Link from "next/link";
import { ChevronRight, KeyRound, LogOut, Wallet } from "lucide-react";
import { nomeDoUsuario } from "@/lib/usuario";
import { createClient } from "@/lib/supabase/server";
import { sair } from "@/app/login/actions";
import { Topo } from "@/components/topo";
import { Avatar } from "@/components/avatar";
import { buscarConfiguracoes } from "@/lib/configuracoes";
import { NomeForm } from "./nome-form";
import { HorarioForm } from "./horario-form";
import { apagarDadosExemplo, gerarDadosExemplo } from "./exemplo-actions";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{titulo}</h2>
      {children}
    </section>
  );
}

function LinhaLink({ href, Icone, titulo, detalhe }: { href: string; Icone: typeof Wallet; titulo: string; detalhe: string }) {
  return (
    <Link href={href} className="card flex items-center gap-3 py-3 active:bg-background">
      <Icone className="size-5 shrink-0 text-lavanda" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{titulo}</span>
        <span className="block text-xs text-muted">{detalhe}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted" />
    </Link>
  );
}

export default async function ContaPage({ searchParams }: PageProps<"/conta">) {
  const { senha, exemplo } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const nome = nomeDoUsuario(user);
  const config = await buscarConfiguracoes();

  return (
    <>
      <Topo titulo="Conta" />
      <div className="flex flex-col gap-6">
        {senha === "ok" && <p className="aviso-ok">Senha trocada.</p>}
        {exemplo === "gerado" && (
          <p className="aviso-ok">Dados de exemplo criados. Veja a Agenda, o Financeiro e o Relatório.</p>
        )}
        {exemplo === "apagado" && <p className="aviso-ok">Dados de exemplo apagados.</p>}
        <div className="flex items-center gap-4">
          <Avatar nome={nome || user?.email || "?"} tamanho="grande" />
          <div className="min-w-0">
            {nome && <p className="truncate text-xl font-semibold">{nome}</p>}
            <p className="truncate text-sm text-muted">{user?.email}</p>
          </div>
        </div>

        <Secao titulo="Perfil">
          <NomeForm nome={nome} />
        </Secao>

        <Secao titulo="Agenda">
          <HorarioForm inicio={config.hora_inicio.slice(0, 5)} fim={config.hora_fim.slice(0, 5)} />
        </Secao>

        <Secao titulo="Financeiro">
          <LinhaLink
            href="/financeiro/configuracoes"
            Icone={Wallet}
            titulo="Taxas e custos"
            detalhe="Taxa da maquininha, comissão ou contas fixas"
          />
        </Secao>

        {/* Só durante o desenvolvimento: preenche a conta com dados fictícios para testar. */}
        {process.env.NODE_ENV !== "production" && (
          <Secao titulo="Dados de exemplo (desenvolvimento)">
            <div className="card flex flex-col gap-3 text-sm">
              <p className="text-muted">
                Cria 6 meses de clientes, sessões, sinais, pagamentos, taxas e despesas fictícios (todos com o
                nome começando por &quot;Exemplo · &quot;), para testar o Financeiro e os relatórios.
              </p>
              <div className="flex flex-wrap gap-2">
                <form action={gerarDadosExemplo}>
                  <button type="submit" className="botao">Gerar dados de exemplo</button>
                </form>
                <form action={apagarDadosExemplo}>
                  <button type="submit" className="botao-secundario">Apagar dados de exemplo</button>
                </form>
              </div>
            </div>
          </Secao>
        )}

        <Secao titulo="Segurança">
          <LinhaLink
            href="/conta/nova-senha"
            Icone={KeyRound}
            titulo="Trocar senha"
            detalhe="Defina uma nova senha de acesso"
          />
          <form action={sair}>
            <button
              type="submit"
              className="card flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-red-400 active:bg-background"
            >
              <LogOut className="size-5" />
              Sair deste aparelho
            </button>
          </form>
        </Secao>
      </div>
    </>
  );
}
