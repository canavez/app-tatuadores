import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
      <Link href={linkEditar} className="card flex items-center gap-3 py-3 active:bg-background">
        <span className="size-6 shrink-0 rounded-full border-2 border-dashed border-amber-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm">Anamnese não preenchida.</span>
          <span className="block text-xs text-amber-400">Preencher anamnese</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted" />
      </Link>
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
