"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { semLimpar } from "@/lib/formulario";
import { STATUS, type Tatuagem } from "@/lib/agenda";
import { reaisParaCampo } from "@/lib/financeiro";
import { salvarSessao } from "./actions";
import { CampoHorario } from "./campo-horario";

type Props = {
  clientes: { id: string; nome: string }[];
  tatuagens: Tatuagem[];
  sessao?: {
    id: string;
    cliente_id: string;
    tatuagem_id: string;
    data: string;
    hora_inicio: string;
    hora_fim: string;
    status: string;
    observacoes: string | null;
    valor: number | null;
  };
  clienteInicial?: string;
  dataInicial?: string;
  /** Vindo de um horário livre da agenda. */
  inicioInicial?: string;
  fimInicial?: string;
};

export function SessaoForm({
  clientes,
  tatuagens,
  sessao,
  clienteInicial,
  dataInicial,
  inicioInicial,
  fimInicial,
}: Props) {
  const [estado, acao, pendente] = useActionState(
    salvarSessao.bind(null, sessao?.id ?? null),
    undefined,
  );
  const [clienteId, setClienteId] = useState(
    sessao?.cliente_id ?? clienteInicial ?? (clientes.length ? "" : "novo"),
  );
  const tatuagensDoCliente = tatuagens.filter((t) => t.cliente_id === clienteId);
  const [tatuagemId, setTatuagemId] = useState(
    sessao?.tatuagem_id ?? (tatuagensDoCliente.length ? tatuagensDoCliente[0].id : "nova"),
  );

  function trocarCliente(id: string) {
    setClienteId(id);
    const primeira = tatuagens.find((t) => t.cliente_id === id);
    setTatuagemId(primeira ? primeira.id : "nova");
  }

  return (
    <form {...semLimpar(acao)} className="card flex flex-col gap-4">
      <label className="campo">
        Cliente *
        <select
          name="cliente_id"
          required
          value={clienteId}
          onChange={(e) => trocarCliente(e.target.value)}
        >
          <option value="" disabled>
            Escolha...
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
          <option value="novo">+ Novo cliente</option>
        </select>
      </label>

      {clienteId === "novo" && (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-4">
          <label className="campo">
            Nome do cliente *
            <input name="cliente_nome" required autoFocus placeholder="Ex.: Ana Souza" />
          </label>
          <p className="text-xs text-muted">
            Telefone, anamnese e o resto você completa depois, em Clientes.
          </p>
        </div>
      )}

      {clienteId && (
        <label className="campo">
          Tatuagem *
          <select
            name="tatuagem_id"
            required
            value={tatuagemId}
            onChange={(e) => setTatuagemId(e.target.value)}
          >
            {tatuagensDoCliente.map((t) => (
              <option key={t.id} value={t.id}>
                {t.descricao}
                {t.local_corpo ? ` (${t.local_corpo})` : ""}
              </option>
            ))}
            <option value="nova">+ Nova tatuagem</option>
          </select>
        </label>
      )}

      {clienteId && tatuagemId === "nova" && (
        <div className="grid gap-4 rounded-lg border border-dashed border-border p-4 sm:grid-cols-2">
          <label className="campo">
            Descrição *
            <input name="descricao" required placeholder="Ex.: fechamento de braço, rosa fineline" />
          </label>
          <label className="campo">
            Local do corpo
            <input name="local_corpo" placeholder="Ex.: antebraço direito" />
          </label>
        </div>
      )}

      <CampoHorario
        data={sessao?.data ?? dataInicial}
        inicio={sessao?.hora_inicio ?? inicioInicial}
        fim={sessao?.hora_fim}
        fimLivre={sessao ? undefined : fimInicial}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="campo">
          Valor da sessão
          <input
            name="valor"
            inputMode="decimal"
            defaultValue={reaisParaCampo(sessao?.valor ?? null)}
            placeholder="Ex.: 800,00"
          />
          <span className="text-xs font-normal text-muted">
            Cobra pelo projeto? Coloque o total na primeira sessão e 0 nas outras.
          </span>
        </label>
        {/* Sessão nova sempre começa aguardando sinal; o status só muda na edição. */}
        {sessao ? (
          <label className="campo">
            Status
            <select name="status" defaultValue={sessao.status}>
              {Object.entries(STATUS).map(([valor, { rotulo }]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="status" value="agendado" />
        )}
      </div>

      <label className="campo">
        Observações
        <textarea
          name="observacoes"
          rows={3}
          defaultValue={sessao?.observacoes ?? ""}
          placeholder="Ex.: trazer referência impressa, sessão de contorno"
        />
      </label>

      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}

      <div className="flex justify-end gap-3">
        <Link href={sessao ? `/agenda/${sessao.id}` : "/agenda"} className="botao-secundario">
          Cancelar
        </Link>
        <button type="submit" className="botao" disabled={pendente}>
          {pendente ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
