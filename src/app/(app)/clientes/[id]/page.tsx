import Link from "next/link";
import { calcularIdade, formatarData, linkWhatsApp } from "@/lib/clientes";
import { excluirCliente } from "../actions";
import { buscarCliente } from "./buscar-cliente";
import { BotaoExcluir } from "./botao-excluir";

export default async function ClientePage({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const cliente = await buscarCliente(id);
  const idade = calcularIdade(cliente.data_nascimento);

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

      <div className="flex justify-end">
        <BotaoExcluir acao={excluirCliente.bind(null, cliente.id)} />
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
