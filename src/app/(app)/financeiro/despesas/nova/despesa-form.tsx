"use client";

import Link from "next/link";
import { useActionState } from "react";
import { semLimpar } from "@/lib/formulario";
import { CATEGORIAS } from "@/lib/financeiro";
import { registrarDespesa } from "../../actions";

export function DespesaForm({ voltar, dataInicial }: { voltar: string; dataInicial: string }) {
  const [estado, acao, pendente] = useActionState(registrarDespesa, undefined);

  return (
    <form {...semLimpar(acao)} className="card flex flex-col gap-4">
      <label className="campo">
        Descrição *
        <input name="descricao" required autoFocus placeholder="Ex.: tintas, agulhas, aluguel da sala" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="campo">
          Valor *
          <input name="valor" inputMode="decimal" required placeholder="Ex.: 150,00" />
        </label>
        <label className="campo">
          Data *
          <input name="data" type="date" required defaultValue={dataInicial} />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Categoria</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIAS).map(([valor, rotulo]) => (
            <label key={valor} className="cursor-pointer">
              <input
                type="radio"
                name="categoria"
                value={valor}
                defaultChecked={valor === "material"}
                className="peer sr-only"
              />
              <span className="block rounded-full border border-border px-4 py-2 text-sm transition peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:font-medium peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                {rotulo}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}

      <div className="flex justify-end gap-3">
        <Link href={voltar} className="botao-secundario">
          Cancelar
        </Link>
        <button type="submit" className="botao" disabled={pendente}>
          {pendente ? "Salvando..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}
