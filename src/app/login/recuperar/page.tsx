"use client";

import Link from "next/link";
import { useActionState } from "react";
import { semLimpar } from "@/lib/formulario";
import { pedirNovaSenha } from "../actions";

export default function RecuperarSenhaPage() {
  const [estado, acao, pendente] = useActionState(pedirNovaSenha, undefined);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 pt-[calc(env(safe-area-inset-top)+3rem)]">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold tracking-tight">Esqueci minha senha</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Informe seu e-mail e enviaremos um link para você criar uma nova senha.
        </p>

        <form {...semLimpar(acao)} className="card mt-8 flex flex-col gap-4">
          <label className="campo">
            E-mail
            <input name="email" type="email" required autoComplete="email" />
          </label>
          {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}
          {estado?.mensagem && <p className="aviso-ok">{estado.mensagem}</p>}
          <button type="submit" className="botao" disabled={pendente}>
            {pendente ? "Enviando..." : "Enviar link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-muted underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  );
}
