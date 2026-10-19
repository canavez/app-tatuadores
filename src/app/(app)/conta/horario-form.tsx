"use client";

import { useActionState } from "react";
import { semLimpar, useHidratado } from "@/lib/formulario";
import { salvarHorario } from "./actions";

export function HorarioForm({ inicio, fim }: { inicio: string; fim: string }) {
  const pronto = useHidratado();
  const [estado, acao, pendente] = useActionState(salvarHorario, undefined);

  return (
    <form onSubmit={semLimpar(acao)} className="card flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">Horário de trabalho</h2>
        <p className="text-xs text-muted">A agenda mostra os horários livres dentro dessa faixa.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="campo">
          Começo
          <input name="hora_inicio" type="time" required defaultValue={inicio} />
        </label>
        <label className="campo">
          Fim
          <input name="hora_fim" type="time" required defaultValue={fim} />
        </label>
      </div>
      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}
      {estado?.mensagem && <p className="aviso-ok">{estado.mensagem}</p>}
      <button type="submit" className="botao self-end" disabled={pendente || !pronto}>
        {pendente ? "Salvando..." : "Salvar horário"}
      </button>
    </form>
  );
}
