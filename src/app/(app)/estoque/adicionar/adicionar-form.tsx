"use client";

import Link from "next/link";
import { useActionState } from "react";
import { semLimpar, useHidratado } from "@/lib/formulario";
import { CATEGORIAS_ESTOQUE, type CategoriaEstoque } from "@/lib/estoque";
import { adicionarItens } from "../actions";

type Props = { grupos: { categoria: CategoriaEstoque; itens: string[] }[] };

export function AdicionarForm({ grupos }: Props) {
  const pronto = useHidratado();
  const [estado, acao, pendente] = useActionState(adicionarItens, undefined);

  return (
    <form onSubmit={semLimpar(acao)} className="flex flex-col gap-4">
      {grupos.map(({ categoria, itens }) => (
        <fieldset key={categoria} className="card flex flex-col gap-3">
          <legend className="sr-only">{CATEGORIAS_ESTOQUE[categoria]}</legend>
          <p className="text-sm font-semibold">{CATEGORIAS_ESTOQUE[categoria]}</p>
          <div className="flex flex-wrap gap-2">
            {itens.map((nome) => (
              <label key={nome} className="cursor-pointer">
                <input type="checkbox" name="item" value={`${categoria}|${nome}`} className="peer sr-only" />
                <span className="block rounded-full border border-border px-3 py-1.5 text-sm transition peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:font-medium peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                  {nome}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <fieldset className="card flex flex-col gap-3">
        <legend className="sr-only">Item próprio</legend>
        <p className="text-sm font-semibold">Não achou? Crie um item</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="campo">
            Nome do item
            <input name="nome" placeholder="Ex.: Tinta vermelha Electric Ink" />
          </label>
          <label className="campo">
            Categoria
            <select name="categoria" defaultValue="outros">
              {Object.entries(CATEGORIAS_ESTOQUE).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] flex justify-end gap-3 rounded-2xl bg-background/90 py-2 backdrop-blur md:bottom-4">
        <Link href="/estoque" className="botao-secundario">
          Cancelar
        </Link>
        <button type="submit" className="botao" disabled={pendente || !pronto}>
          {pendente ? "Adicionando..." : "Adicionar ao estoque"}
        </button>
      </div>
    </form>
  );
}
