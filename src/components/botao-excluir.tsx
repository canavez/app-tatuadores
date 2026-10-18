"use client";

import { useState } from "react";

type Props = {
  acao: () => Promise<void>;
  rotulo: string;
  confirmacao: string;
};

/**
 * Botão de excluir que pede confirmação na própria tela.
 * (A janela confirm() do navegador é bloqueada em alguns navegadores embutidos
 * e fica feia no celular.)
 */
export function BotaoExcluir({ acao, rotulo, confirmacao }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="text-sm text-red-600 underline hover:opacity-80 dark:text-red-400"
      >
        {rotulo}
      </button>
    );
  }

  return (
    <form
      action={acao}
      onSubmit={() => setExcluindo(true)}
      role="alertdialog"
      aria-label={confirmacao}
      className="flex basis-full flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm"
    >
      <p>{confirmacao}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="botao-secundario py-1.5"
          disabled={excluindo}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          disabled={excluindo}
        >
          {excluindo ? "Excluindo..." : "Sim, excluir"}
        </button>
      </div>
    </form>
  );
}
