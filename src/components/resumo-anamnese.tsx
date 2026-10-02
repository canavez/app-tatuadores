import Link from "next/link";
import { alertas, type Anamnese } from "@/lib/anamnese";

type Props = {
  clienteId: string;
  anamnese: Anamnese | null;
};

/** Destaque da anamnese: pendente, sem pontos de atenção, ou a lista de alertas. */
export function ResumoAnamnese({ clienteId, anamnese }: Props) {
  const linkEditar = `/clientes/${clienteId}/editar#anamnese`;

  if (!anamnese) {
    return (
      <div className="card flex flex-wrap items-center justify-between gap-2 border-dashed py-3">
        <span className="text-sm text-muted">Anamnese não preenchida.</span>
        <Link href={linkEditar} className="text-sm font-medium underline">
          Preencher anamnese
        </Link>
      </div>
    );
  }

  const lista = alertas(anamnese);

  if (lista.length === 0) {
    return (
      <div className="card flex flex-wrap items-center justify-between gap-2 py-3">
        <span className="text-sm text-green-700 dark:text-green-400">
          Anamnese: nenhum ponto de atenção.
        </span>
        <Link href={linkEditar} className="text-sm text-muted underline">
          Ver / editar
        </Link>
      </div>
    );
  }

  return (
    <div className="card border-red-500/40 bg-red-500/5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-red-700 dark:text-red-400">
          ⚠ Atenção na anamnese
        </span>
        <Link href={linkEditar} className="text-sm text-muted underline">
          Ver / editar
        </Link>
      </div>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {lista.map((item) => (
          <li key={item} className="whitespace-pre-wrap">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
