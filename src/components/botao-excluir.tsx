"use client";

type Props = {
  acao: () => Promise<void>;
  rotulo: string;
  confirmacao: string;
};

export function BotaoExcluir({ acao, rotulo, confirmacao }: Props) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!confirm(confirmacao)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="text-sm text-red-600 underline hover:opacity-80 dark:text-red-400"
      >
        {rotulo}
      </button>
    </form>
  );
}
