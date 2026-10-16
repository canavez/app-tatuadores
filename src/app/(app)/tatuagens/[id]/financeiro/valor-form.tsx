"use client";

import { useActionState } from "react";
import { reaisParaCampo } from "@/lib/financeiro";
import { salvarValor } from "./actions";

export function ValorForm({ tatuagemId, valor }: { tatuagemId: string; valor: number | null }) {
  const [estado, acao, pendente] = useActionState(salvarValor.bind(null, tatuagemId), undefined);

  return (
    <form action={acao} className="flex flex-col gap-2">
      <label className="campo">
        Valor combinado
        <div className="flex gap-2">
          <input
            name="valor"
            inputMode="decimal"
            defaultValue={reaisParaCampo(valor === null ? null : Number(valor))}
            placeholder="Ex.: 1.500,00"
            className="flex-1"
          />
          <button type="submit" className="botao-secundario" disabled={pendente}>
            {pendente ? "..." : "Salvar"}
          </button>
        </div>
      </label>
      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}
    </form>
  );
}
