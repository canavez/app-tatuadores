"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FORMAS, TIPOS, type TipoPagamento } from "@/lib/financeiro";
import { registrarPagamento } from "../../actions";

type Props = {
  sessaoId: string;
  hoje: string;
  tipoInicial: TipoPagamento;
  valorSugerido: string;
};

/** Opções em formato de "pílulas" (radio), mais fáceis de tocar no celular. */
function Opcoes({
  nome,
  opcoes,
  inicial,
}: {
  nome: string;
  opcoes: Record<string, string>;
  inicial: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(opcoes).map(([valor, rotulo]) => (
        <label key={valor} className="cursor-pointer">
          <input
            type="radio"
            name={nome}
            value={valor}
            defaultChecked={valor === inicial}
            className="peer sr-only"
          />
          <span className="block rounded-full border border-border px-4 py-2 text-sm transition peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:font-medium peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
            {rotulo}
          </span>
        </label>
      ))}
    </div>
  );
}

export function PagamentoForm({
  sessaoId,
  hoje,
  tipoInicial,
  valorSugerido,
}: Props) {
  const [estado, acao, pendente] = useActionState(
    registrarPagamento.bind(null, sessaoId),
    undefined,
  );

  return (
    <form action={acao} className="card flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Tipo</legend>
        <Opcoes nome="tipo" opcoes={TIPOS} inicial={tipoInicial} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="campo">
          Valor recebido *
          <input
            name="valor"
            inputMode="decimal"
            required
            autoFocus
            defaultValue={valorSugerido}
            placeholder="Ex.: 200,00"
          />
        </label>
        <label className="campo">
          Data *
          <input name="data" type="date" required defaultValue={hoje} />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Forma de pagamento</legend>
        <Opcoes nome="forma" opcoes={FORMAS} inicial="pix" />
      </fieldset>

      <label className="campo">
        Observações
        <input name="observacoes" placeholder="Ex.: pago pela mãe, parcelado em 2x" />
      </label>

      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}

      <div className="flex justify-end gap-3">
        <Link href={`/agenda/${sessaoId}`} className="botao-secundario">
          Cancelar
        </Link>
        <button type="submit" className="botao" disabled={pendente}>
          {pendente ? "Salvando..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}
