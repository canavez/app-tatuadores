import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/clientes";
import { Avatar } from "@/components/avatar";
import { Topo } from "@/components/topo";
import { BotaoFlutuante } from "@/components/botao-flutuante";

export default async function ClientesPage({ searchParams }: PageProps<"/clientes">) {
  const { q } = await searchParams;
  // Remove caracteres que quebrariam o filtro .or() do Supabase.
  const busca = typeof q === "string" ? q.replace(/[,()%]/g, "").trim() : "";

  const supabase = await createClient();
  let consulta = supabase.from("clientes").select("id, nome, telefone, instagram").order("nome");
  if (busca) {
    consulta = consulta.or(
      `nome.ilike.%${busca}%,telefone.ilike.%${busca}%,instagram.ilike.%${busca}%`,
    );
  }
  const { data, error } = await consulta;
  const clientes = (data ?? []) as Pick<Cliente, "id" | "nome" | "telefone" | "instagram">[];

  return (
    <>
      <Topo titulo="Clientes" />

      <form role="search" className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          name="q"
          defaultValue={busca}
          aria-label="Buscar clientes"
          placeholder="Buscar por nome, telefone ou Instagram"
          className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 outline-none focus:border-foreground"
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
          {clientes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clientes/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 active:bg-background"
              >
                <Avatar nome={c.nome} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.nome}</span>
                  <span className="block truncate text-sm text-muted">
                    {[c.telefone, c.instagram && `@${c.instagram}`].filter(Boolean).join(" · ") ||
                      "Sem contato"}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <BotaoFlutuante href="/clientes/novo" rotulo="Novo cliente" />
    </>
  );
}
