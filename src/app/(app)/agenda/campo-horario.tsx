"use client";

import { useState } from "react";
import { horaDeMinutos, minutosDoDia } from "@/lib/agenda";

const DURACOES = [60, 120, 180, 240, 360];

const rotulo = (minutos: number) => `${minutos / 60} h`;

type Props = {
  data?: string;
  inicio?: string;
  fim?: string;
  /** Fim do horário livre de onde a sessão foi aberta (sugere 2 h, sem passar dele). */
  fimLivre?: string;
};

/**
 * Data, início e duração da sessão. Tocar numa duração calcula o término;
 * "Outra" mostra o campo de término para digitar.
 */
export function CampoHorario({
  data,
  inicio: inicioInicial = "",
  fim: fimInicial = "",
  fimLivre,
}: Props) {
  const [inicio, setInicio] = useState(inicioInicial);
  const duracaoInicial = (() => {
    if (inicioInicial && fimLivre) {
      // Vindo de um horário livre: 2 h se couber; senão, termina no fim do horário livre.
      return minutosDoDia(fimLivre) - minutosDoDia(inicioInicial) >= 120 ? 120 : null;
    }
    if (!inicioInicial || !fimInicial) return 120;
    const d = minutosDoDia(fimInicial) - minutosDoDia(inicioInicial);
    return DURACOES.includes(d) ? d : null;
  })();
  const [duracao, setDuracao] = useState<number | null>(duracaoInicial);
  const [fimManual, setFimManual] = useState(fimInicial || fimLivre || "");

  const fimCalculado =
    inicio && duracao !== null ? minutosDoDia(inicio) + duracao : null;
  const passaDaMeiaNoite = fimCalculado !== null && fimCalculado >= 24 * 60;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-4">
        <label className="campo">
          Data *
          <input name="data" type="date" required defaultValue={data} />
        </label>
        <label className="campo">
          Início *
          <input
            name="hora_inicio"
            type="time"
            required
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Duração</legend>
        <div className="flex flex-wrap gap-2">
          {[...DURACOES, null].map((d) => (
            <label key={d ?? "outra"} className="cursor-pointer">
              <input
                type="radio"
                name="duracao"
                checked={duracao === d}
                onChange={() => setDuracao(d)}
                className="peer sr-only"
              />
              <span className="block rounded-full border border-border px-3.5 py-1.5 text-sm transition peer-checked:border-accent peer-checked:bg-accent/15 peer-checked:font-medium peer-checked:text-violet-200 peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                {d === null ? "Outra" : rotulo(d)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {duracao === null ? (
        <label className="campo">
          Término *
          <input
            name="hora_fim"
            type="time"
            required
            value={fimManual}
            onChange={(e) => setFimManual(e.target.value)}
          />
        </label>
      ) : (
        <>
          <input
            type="hidden"
            name="hora_fim"
            value={
              fimCalculado !== null && !passaDaMeiaNoite
                ? horaDeMinutos(fimCalculado)
                : ""
            }
          />
          {fimCalculado !== null && (
            <p
              className={`text-sm ${passaDaMeiaNoite ? "text-red-400" : "text-violet-300"}`}
            >
              {passaDaMeiaNoite
                ? "Passa da meia-noite. Escolha outra duração."
                : `Termina às ${horaDeMinutos(fimCalculado)}`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
