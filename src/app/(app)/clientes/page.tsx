import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/clientes";

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Link href="/clientes/novo" className="botao">
          + Novo cliente
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={busca}
          placeholder="Buscar por nome, telefone ou Instagram"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-foreground"
        />
        <button type="submit" className="botao-secundario">
          Buscar
        </button>
      </form>

      {error && <p className="aviso-erro">Erro ao carregar clientes.</p>}

      {!error && clientes.length === 0 && (
        <div className="card text-center text-sm text-muted">
          {busca ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
        </div>
      )}

      {clientes.length > 0 && (
        <ul className="card divide-y divide-border p-0">
          {clientes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clientes/${c.id}`}
                className="flex flex-col px-5 py-3 hover:bg-background sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium">{c.nome}</span>
                <span className="text-sm text-muted">
                  {[c.telefone, c.instagram && `@${c.instagram}`].filter(Boolean).join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
