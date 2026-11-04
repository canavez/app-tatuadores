"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { semLimpar } from "@/lib/formulario";
import { criarConta, entrar, entrarCom } from "./actions";

export function LoginForm({
  erroRetorno,
  aviso,
  provedores,
  modoInicial = "entrar",
}: {
  erroRetorno?: string;
  /** Mensagem de sucesso no topo (ex.: conta excluída). */
  aviso?: string;
  provedores: { google: boolean; apple: boolean };
  /** "criar" abre direto no cadastro (link "Criar conta grátis" da página inicial). */
  modoInicial?: "entrar" | "criar";
}) {
  const algumSocial = provedores.google || provedores.apple;
  const [modo, setModo] = useState<"entrar" | "criar">(modoInicial);
  const [estadoEntrar, acaoEntrar, entrando] = useActionState(
    entrar,
    undefined,
  );
  const [estadoCriar, acaoCriar, criando] = useActionState(
    criarConta,
    undefined,
  );
  const [estadoSocial, acaoSocial, indoSocial] = useActionState(
    entrarCom,
    undefined,
  );

  const criandoConta = modo === "criar";
  const estado = criandoConta ? estadoCriar : estadoEntrar;
  const pendente = criandoConta ? criando : entrando;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 pt-[calc(env(safe-area-inset-top)+3rem)]">
      <div className="w-full max-w-sm">
        <h1>
          <Image
            src="/logo.png"
            alt="Ravenn"
            width={640}
            height={203}
            priority
            className="mx-auto h-auto w-56"
          />
        </h1>
        <p className="mt-4 text-center text-sm text-muted">
          Agenda, clientes e financeiro do seu estúdio
        </p>

        {/* Google e Apple: só aparecem quando ativados no Supabase (cada botão envia qual provedor usar) */}
        {algumSocial && (
          <form {...semLimpar(acaoSocial)} className="mt-8 flex flex-col gap-2">
            {provedores.google && (
              <button
                type="submit"
                name="provedor"
                value="google"
                disabled={indoSocial}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:opacity-90 disabled:opacity-50"
              >
                <LogoGoogle />
                Continuar com Google
              </button>
            )}
            {provedores.apple && (
              <button
                type="submit"
                name="provedor"
                value="apple"
                disabled={indoSocial}
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <LogoApple />
                Continuar com Apple
              </button>
            )}
            {estadoSocial?.erro && (
              <p className="aviso-erro">{estadoSocial.erro}</p>
            )}
          </form>
        )}

        {algumSocial ? (
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            ou com e-mail
            <span className="h-px flex-1 bg-border" />
          </div>
        ) : (
          <div className="mt-8" />
        )}

        {aviso && <p className="aviso-ok mb-4">{aviso}</p>}
        {erroRetorno && <p className="aviso-erro mb-4">{erroRetorno}</p>}

        <form
          {...semLimpar(criandoConta ? acaoCriar : acaoEntrar)}
          className="card flex flex-col gap-4"
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
            <Link
              href="/login/recuperar"
              className="-mt-2 self-end text-sm text-muted underline"
            >
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
        {criandoConta && (
          <p className="mt-3 text-center text-xs text-muted">
            Ao criar a conta, você concorda com os{" "}
            <Link href="/termos" className="underline">
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="underline">
              política de privacidade
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}

function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function LogoApple() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.86-.76-1.47.02-2.83.86-3.59 2.17-1.53 2.65-.39 6.58 1.1 8.73.73 1.05 1.6 2.23 2.73 2.19 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.28-.88-2.3-3.48zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.67-.92 2.66.97.08 1.96-.49 2.56-1.21z" />
    </svg>
  );
}
