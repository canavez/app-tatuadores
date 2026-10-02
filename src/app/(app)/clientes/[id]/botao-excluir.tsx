"use client";

export function BotaoExcluir({ acao }: { acao: () => Promise<void> }) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!confirm("Excluir este cliente? Essa ação não pode ser desfeita.")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="text-sm text-red-600 underline hover:opacity-80 dark:text-red-400"
      >
        Excluir cliente
      </button>
    </form>
  );
}
