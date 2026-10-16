"use client";

import { useActionState } from "react";
import { semLimpar } from "@/lib/formulario";
import { salvarNome } from "./actions";

export function NomeForm({ nome }: { nome: string }) {
  const [estado, acao, pendente] = useActionState(salvarNome, undefined);

  return (
    <form onSubmit={semLimpar(acao)} className="card flex flex-col gap-3">
      <label className="campo">
        Seu nome profissional
        <input name="nome" required defaultValue={nome} placeholder="Ex.: Ana Ravenn Tattoo" />
      </label>
      <p className="text-xs text-muted">Aparece nos termos de consentimento assinados pelos clientes.</p>
      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}
      {estado?.mensagem && <p className="aviso-ok">{estado.mensagem}</p>}
      <button type="submit" className="botao self-end" disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar nome"}
      </button>
    </form>
  );
}
