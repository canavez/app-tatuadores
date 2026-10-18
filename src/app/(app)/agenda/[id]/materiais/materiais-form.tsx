"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { semLimpar } from "@/lib/formulario";
import { salvarMateriais } from "../../actions";

type Grupo = { rotulo: string; itens: { id: string; nome: string; quantidade: number }[] };

type Props = {
  sessaoId: string;
  realizar: boolean;
  grupos: Grupo[];
  usados: Record<string, number>;
  acaoPular: () => Promise<void>;
};

export function MateriaisForm({ sessaoId, realizar, grupos, usados, acaoPular }: Props) {
  const [estado, acao, pendente] = useActionState(salvarMateriais.bind(null, sessaoId, realizar), undefined);
  const [qtd, setQtd] = useState<Record<string, number>>(usados);
  const mudar = (id: string, delta: number) =>
    setQtd((q) => ({ ...q, [id]: Math.min(Math.max((q[id] ?? 0) + delta, 0), 999) }));

  return (
    <div className="flex flex-col gap-4">
      <form id="materiais" onSubmit={semLimpar(acao)} className="flex flex-col gap-4">
        {grupos.map((g) => (
          <section key={g.rotulo} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{g.rotulo}</h2>
            <ul className="card divide-y divide-border p-0">
              {g.itens.map((item) => {
                const n = qtd[item.id] ?? 0;
                return (
                  <li key={item.id} className="flex items-center gap-2 px-4 py-2">
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate ${n > 0 ? "font-medium" : ""}`}>{item.nome}</span>
                      <span className="block text-xs text-muted">{item.quantidade} no estoque</span>
                    </span>
                    <input type="hidden" name={`q_${item.id}`} value={n} />
                    <button
                      type="button"
                      onClick={() => mudar(item.id, -1)}
                      aria-label={`Tirar 1 de ${item.nome}`}
                      disabled={n === 0}
                      className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-background disabled:opacity-40"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span
                      aria-label={`Usados de ${item.nome}`}
                      className={`w-8 text-center font-semibold tabular-nums ${n > 0 ? "text-accent" : "text-muted"}`}
                    >
                      {n}
                    </span>
                    <button
                      type="button"
                      onClick={() => mudar(item.id, 1)}
                      aria-label={`Somar 1 em ${item.nome}`}
                      className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-background"
                    >
                      <Plus className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}
      </form>

      <div className="flex justify-end gap-3">
        {realizar ? (
          <form action={acaoPular}>
            <button type="submit" className="botao-secundario">
              Pular
            </button>
          </form>
        ) : (
          <Link href={`/agenda/${sessaoId}`} className="botao-secundario">
            Cancelar
          </Link>
        )}
        <button type="submit" form="materiais" className="botao" disabled={pendente}>
          {pendente ? "Salvando..." : realizar ? "Salvar e concluir" : "Salvar"}
        </button>
      </div>
    </div>
  );
}
