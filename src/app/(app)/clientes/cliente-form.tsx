"use client";

import Link from "next/link";
import { useActionState } from "react";
import { semLimpar, useHidratado } from "@/lib/formulario";
import { formatarData, type Cliente } from "@/lib/clientes";
import { CONDICOES, TEXTOS, type Anamnese } from "@/lib/anamnese";
import { partesLocais } from "@/lib/agenda";
import { salvarCliente } from "./actions";

type Props = {
  cliente?: Cliente;
  anamnese?: Anamnese | null;
};

export function ClienteForm({ cliente, anamnese }: Props) {
  const pronto = useHidratado();
  const [estado, acao, pendente] = useActionState(
    salvarCliente.bind(null, cliente?.id ?? null),
    undefined,
  );

  return (
    <form onSubmit={semLimpar(acao)} className="card flex flex-col gap-4">
      <label className="campo">
        Nome *
        <input name="nome" required defaultValue={cliente?.nome} autoComplete="off" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="campo">
          Telefone / WhatsApp
          <input
            name="telefone"
            type="tel"
            defaultValue={cliente?.telefone ?? ""}
            placeholder="(11) 91234-5678"
          />
        </label>
        <label className="campo">
          Instagram
          <input name="instagram" defaultValue={cliente?.instagram ?? ""} placeholder="@usuario" />
        </label>
        <label className="campo">
          E-mail
          <input name="email" type="email" defaultValue={cliente?.email ?? ""} />
        </label>
        <label className="campo">
          Data de nascimento
          <input
            name="data_nascimento"
            type="date"
            defaultValue={cliente?.data_nascimento ?? ""}
          />
        </label>
        <label className="campo">
          CPF
          <input name="cpf" inputMode="numeric" defaultValue={cliente?.cpf ?? ""} />
        </label>
      </div>

      <label className="campo">
        Observações
        <textarea name="observacoes" rows={3} defaultValue={cliente?.observacoes ?? ""} />
      </label>

      {cliente && (
        <fieldset id="anamnese" className="flex scroll-mt-6 flex-col gap-4 border-t border-border pt-4">
          <input type="hidden" name="com_anamnese" value="1" />
          {anamnese && <input type="hidden" name="anamnese_existente" value="1" />}
          <legend className="contents">
            <span className="text-lg font-semibold">Anamnese</span>
          </legend>
          <p className="-mt-2 text-sm text-muted">
            Opcional. Marque o que se aplica ao cliente.
            {anamnese &&
              ` Última atualização: ${formatarData(partesLocais(anamnese.atualizado_em).data)}.`}
          </p>

          {!anamnese && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="nada_consta" className="size-4 accent-accent" />
              Cliente respondeu e não tem nada a declarar
            </label>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {CONDICOES.map((c) => (
              <label
                key={c.campo}
                className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5"
              >
                <input
                  type="checkbox"
                  name={c.campo}
                  defaultChecked={anamnese?.[c.campo] ?? false}
                  className="mt-0.5 size-4 accent-accent"
                />
                {c.rotulo}
              </label>
            ))}
          </div>

          {TEXTOS.map((t) => (
            <label key={t.campo} className="campo">
              {t.rotulo}
              <textarea
                name={t.campo}
                rows={2}
                placeholder={t.dica}
                defaultValue={anamnese?.[t.campo] ?? ""}
              />
            </label>
          ))}
        </fieldset>
      )}

      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}

      <div className="flex justify-end gap-3">
        <Link
          href={cliente ? `/clientes/${cliente.id}` : "/clientes"}
          className="botao-secundario"
        >
          Cancelar
        </Link>
        <button type="submit" className="botao" disabled={pendente || !pronto}>
          {pendente ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
