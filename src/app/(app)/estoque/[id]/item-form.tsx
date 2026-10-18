"use client";

import Link from "next/link";
import { useActionState } from "react";
import { semLimpar } from "@/lib/formulario";
import { CATEGORIAS_ESTOQUE, type ItemEstoque } from "@/lib/estoque";
import { salvarItem } from "../actions";

export function ItemForm({ item }: { item: ItemEstoque }) {
  const [estado, acao, pendente] = useActionState(salvarItem.bind(null, item.id), undefined);

  return (
    <form onSubmit={semLimpar(acao)} className="card flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="campo">
          Nome *
          <input name="nome" required defaultValue={item.nome} />
        </label>
        <label className="campo">
          Categoria
          <select name="categoria" defaultValue={item.categoria}>
            {Object.entries(CATEGORIAS_ESTOQUE).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="campo">
          Quantidade
          <input name="quantidade" inputMode="numeric" defaultValue={item.quantidade} />
        </label>
        <label className="campo">
          Unidade
          <input name="unidade" defaultValue={item.unidade} placeholder="un, caixa, ml" />
        </label>
        <label className="campo">
          Estoque mínimo
          <input
            name="estoque_minimo"
            inputMode="numeric"
            defaultValue={item.estoque_minimo || ""}
            placeholder="0"
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted">
        Quando a quantidade chegar no estoque mínimo, o item aparece como &quot;acabando&quot; no estoque e na
        tela Hoje. Deixe em branco para não avisar.
      </p>

      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}

      <div className="flex justify-end gap-3">
        <Link href="/estoque" className="botao-secundario">
          Cancelar
        </Link>
        <button type="submit" className="botao" disabled={pendente}>
          {pendente ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
