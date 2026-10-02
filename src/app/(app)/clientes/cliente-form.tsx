"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Cliente } from "@/lib/clientes";
import { salvarCliente } from "./actions";

export function ClienteForm({ cliente }: { cliente?: Cliente }) {
  const [estado, acao, pendente] = useActionState(
    salvarCliente.bind(null, cliente?.id ?? null),
    undefined,
  );

  return (
    <form action={acao} className="card flex flex-col gap-4">
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

      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}

      <div className="flex justify-end gap-3">
        <Link
          href={cliente ? `/clientes/${cliente.id}` : "/clientes"}
          className="botao-secundario"
        >
          Cancelar
        </Link>
        <button type="submit" className="botao" disabled={pendente}>
          {pendente ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
