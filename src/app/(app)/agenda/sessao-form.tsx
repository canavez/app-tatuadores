"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { STATUS, type Tatuagem } from "@/lib/agenda";
import { salvarSessao } from "./actions";

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
  };
  clienteInicial?: string;
  dataInicial?: string;
};

export function SessaoForm({ clientes, tatuagens, sessao, clienteInicial, dataInicial }: Props) {
  const [estado, acao, pendente] = useActionState(
    salvarSessao.bind(null, sessao?.id ?? null),
    undefined,
  );
  const [clienteId, setClienteId] = useState(sessao?.cliente_id ?? clienteInicial ?? "");
  const tatuagensDoCliente = tatuagens.filter((t) => t.cliente_id === clienteId);
  const [tatuagemId, setTatuagemId] = useState(
    sessao?.tatuagem_id ?? (tatuagensDoCliente.length ? tatuagensDoCliente[0].id : "nova"),
  );

  function trocarCliente(id: string) {
    setClienteId(id);
    const primeira = tatuagens.find((t) => t.cliente_id === id);
    setTatuagemId(primeira ? primeira.id : "nova");
  }

  if (clientes.length === 0) {
    return (
      <div className="card text-center text-sm text-muted">
        Cadastre um cliente antes de agendar.{" "}
        <Link href="/clientes/novo" className="font-medium text-foreground underline">
          Novo cliente
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="card flex flex-col gap-4">
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
        </select>
      </label>

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

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="campo">
          Data *
          <input name="data" type="date" required defaultValue={sessao?.data ?? dataInicial} />
        </label>
        <label className="campo">
          Início *
          <input name="hora_inicio" type="time" required defaultValue={sessao?.hora_inicio} />
        </label>
        <label className="campo">
          Término *
          <input name="hora_fim" type="time" required defaultValue={sessao?.hora_fim} />
        </label>
      </div>

      <label className="campo">
        Status
        <select name="status" defaultValue={sessao?.status ?? "agendado"}>
          {Object.entries(STATUS).map(([valor, { rotulo }]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </label>

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
