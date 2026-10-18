"use client";

import { useActionState, useState } from "react";
import { semLimpar } from "@/lib/formulario";
import { percentualParaCampo, reaisParaCampo, type Configuracoes } from "@/lib/financeiro";
import { salvarTaxas } from "./actions";

const CAMPOS = [
  { campo: "taxa_debito", rotulo: "Débito" },
  { campo: "taxa_credito", rotulo: "Crédito" },
] as const;

const MODELOS = [
  { valor: "comissao", rotulo: "Pago comissão ao estúdio" },
  { valor: "proprio", rotulo: "Estúdio próprio" },
] as const;

export function TaxasForm({ config }: { config: Configuracoes }) {
  const [estado, acao, pendente] = useActionState(salvarTaxas, undefined);
  const [modelo, setModelo] = useState(config.modelo);

  return (
    <form onSubmit={semLimpar(acao)} className="card flex flex-col gap-4">
      <div>
        <h2 className="font-semibold">Taxas e custos</h2>
        <p className="text-xs text-muted">
          Usados para calcular o lucro do mês. Deixe em branco o que não se aplica.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Taxa da maquininha (%)</legend>
        <div className="grid grid-cols-2 gap-3">
          {CAMPOS.map(({ campo, rotulo }) => (
            <label key={campo} className="campo">
              {rotulo}
              <input
                name={campo}
                inputMode="decimal"
                defaultValue={percentualParaCampo(config[campo])}
                placeholder="0"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Onde você trabalha</legend>
        <div className="flex flex-wrap gap-2">
          {MODELOS.map(({ valor, rotulo }) => (
            <label key={valor} className="cursor-pointer">
              <input
                type="radio"
                name="modelo"
                value={valor}
                checked={modelo === valor}
                onChange={() => setModelo(valor)}
                className="peer sr-only"
              />
              <span className="block rounded-full border border-border px-4 py-2 text-sm transition peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:font-medium peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                {rotulo}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Os dois campos ficam no formulário; só o do modelo escolhido aparece. */}
      <label className={`campo ${modelo === "comissao" ? "" : "hidden"}`}>
        Comissão do estúdio (%)
        <input
          name="comissao_estudio"
          inputMode="decimal"
          defaultValue={percentualParaCampo(config.comissao_estudio)}
          placeholder="0"
        />
        <span className="text-xs font-normal text-muted">
          Parte do valor recebido que fica com o estúdio.
        </span>
      </label>

      <label className={`campo ${modelo === "proprio" ? "" : "hidden"}`}>
        Contas fixas por mês (R$)
        <input
          name="contas_fixas"
          inputMode="decimal"
          defaultValue={Number(config.contas_fixas) ? reaisParaCampo(Number(config.contas_fixas)) : ""}
          placeholder="Ex.: 1.800,00"
        />
        <span className="text-xs font-normal text-muted">
          Some aluguel, água, luz, internet e o que mais você paga todo mês.
        </span>
      </label>

      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}
      {estado?.mensagem && <p className="aviso-ok">{estado.mensagem}</p>}
      <button type="submit" className="botao self-end" disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
