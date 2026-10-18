"use client";

import { useActionState } from "react";
import { semLimpar } from "@/lib/formulario";
import { percentualParaCampo, type Configuracoes } from "@/lib/financeiro";
import { salvarTaxas } from "./actions";

const CAMPOS = [
  { campo: "taxa_debito", rotulo: "Débito" },
  { campo: "taxa_credito", rotulo: "Crédito" },
  { campo: "taxa_pix", rotulo: "Pix" },
] as const;

export function TaxasForm({ config }: { config: Configuracoes }) {
  const [estado, acao, pendente] = useActionState(salvarTaxas, undefined);

  return (
    <form onSubmit={semLimpar(acao)} className="card flex flex-col gap-4">
      <div>
        <h2 className="font-semibold">Taxas e comissão</h2>
        <p className="text-xs text-muted">
          Usadas para calcular quanto sobra de cada pagamento. Deixe em branco o que não se aplica.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Taxa da maquininha (%)</legend>
        <div className="grid grid-cols-3 gap-3">
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

      <label className="campo">
        Comissão do estúdio (%)
        <input
          name="comissao_estudio"
          inputMode="decimal"
          defaultValue={percentualParaCampo(config.comissao_estudio)}
          placeholder="0"
        />
        <span className="text-xs font-normal text-muted">
          Parte do valor recebido que fica com o estúdio. Se o estúdio é seu, deixe em branco.
        </span>
      </label>

      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}
      {estado?.mensagem && <p className="aviso-ok">{estado.mensagem}</p>}
      <button type="submit" className="botao self-end" disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar taxas"}
      </button>
    </form>
  );
}
