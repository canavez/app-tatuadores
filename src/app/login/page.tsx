"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { semLimpar } from "@/lib/formulario";
import { criarConta, entrar } from "./actions";

export default function LoginPage() {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [estadoEntrar, acaoEntrar, entrando] = useActionState(entrar, undefined);
  const [estadoCriar, acaoCriar, criando] = useActionState(criarConta, undefined);

  const criandoConta = modo === "criar";
  const estado = criandoConta ? estadoCriar : estadoEntrar;
  const pendente = criandoConta ? criando : entrando;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 pt-[calc(env(safe-area-inset-top)+3rem)]">
      <div className="w-full max-w-sm">
        {/* Enquanto a logo não está pronta, o nome escrito faz o papel dela. */}
        <h1 className="text-center text-4xl font-bold tracking-tight">
          Ravenn<span className="text-accent">.</span>
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          Agenda, clientes e financeiro do seu estúdio
        </p>

        <form
          {...semLimpar(criandoConta ? acaoCriar : acaoEntrar)}
          className="card mt-8 flex flex-col gap-4"
        >
          {criandoConta && (
            <label className="campo">
              Seu nome
              <input name="nome" required autoComplete="name" />
            </label>
          )}
          <label className="campo">
            E-mail
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="campo">
            Senha
            <input
              name="senha"
              type="password"
              required
              minLength={criandoConta ? 8 : undefined}
              autoComplete={criandoConta ? "new-password" : "current-password"}
            />
          </label>

          {!criandoConta && (
            <Link href="/login/recuperar" className="-mt-2 self-end text-sm text-muted underline">
              Esqueci minha senha
            </Link>
          )}

          {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}
          {estado?.mensagem && <p className="aviso-ok">{estado.mensagem}</p>}

          <button type="submit" className="botao" disabled={pendente}>
            {pendente ? "Aguarde..." : criandoConta ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {criandoConta ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
          <button
            type="button"
            onClick={() => setModo(criandoConta ? "entrar" : "criar")}
            className="font-medium text-foreground underline"
          >
            {criandoConta ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </div>
    </main>
  );
}
