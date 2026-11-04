"use client";

import Link from "next/link";
import { useActionState } from "react";
import { semLimpar } from "@/lib/formulario";
import { excluirConta } from "./actions";

export function ExcluirForm() {
  const [estado, acao, pendente] = useActionState(excluirConta, undefined);

  return (
    <form {...semLimpar(acao)} className="card flex flex-col gap-4 border-red-500/30">
      <label className="campo">
        Para confirmar, digite EXCLUIR
        <input name="confirmacao" required autoComplete="off" autoCapitalize="characters" />
      </label>
      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/conta" className="botao-secundario">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pendente}
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pendente ? "Excluindo..." : "Excluir minha conta"}
        </button>
      </div>
    </form>
  );
}
