"use client";

import Link from "next/link";
import { useActionState } from "react";
import { semLimpar } from "@/lib/formulario";
import { trocarSenha } from "@/app/login/actions";

export function NovaSenhaForm() {
  const [estado, acao, pendente] = useActionState(trocarSenha, undefined);

  return (
    <form {...semLimpar(acao)} className="card flex flex-col gap-4">
      <label className="campo">
        Nova senha
        <input name="senha" type="password" required minLength={8} autoComplete="new-password" />
        <span className="text-xs font-normal text-muted">Pelo menos 8 caracteres.</span>
      </label>
      <label className="campo">
        Repita a nova senha
        <input name="confirmacao" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/conta" className="botao-secundario">
          Cancelar
        </Link>
        <button type="submit" className="botao" disabled={pendente}>
          {pendente ? "Salvando..." : "Salvar nova senha"}
        </button>
      </div>
    </form>
  );
}
