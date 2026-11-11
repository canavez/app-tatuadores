"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { assinar, gerenciar } from "./actions";
import { AssinarPelaApple, GerenciarPelaApple, usePrecoApple } from "./apple";
import { AssinarPeloGoogle, GerenciarPeloGoogle, usePrecoGoogle } from "./google";

type Plataforma = "web" | "ios" | "android";

/**
 * Nos apps a loja não deixa vender assinatura por fora dela (nem pôr botão ou link para pagar
 * no site). No iPhone a compra é pela Apple, no Android pelo Google Play; no site (ravenn.me),
 * pelo Stripe.
 */
function usePlataforma() {
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  useEffect(() => {
    import("@capacitor/core")
      .then(({ Capacitor }) => {
        const p = Capacitor.getPlatform();
        setPlataforma(p === "ios" || p === "android" ? p : "web");
      })
      .catch(() => setPlataforma("web"));
  }, []);
  return plataforma;
}

function Enviar({ children, classe }: { children: React.ReactNode; classe: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={classe} disabled={pending}>
      {pending ? "Abrindo…" : children}
    </button>
  );
}

/** Preço do card: no app, o que a loja (App Store ou Google Play) mostra; no site, o do Stripe. */
export function Preco({ doSite }: { doSite: string }) {
  const plataforma = usePlataforma();
  if (plataforma === null) return <span className="text-3xl font-bold">&nbsp;</span>;
  if (plataforma === "ios") return <PrecoApple doSite={doSite} />;
  if (plataforma === "android") return <PrecoGoogle doSite={doSite} />;
  return <span className="text-3xl font-bold">{doSite}</span>;
}

function PrecoApple({ doSite }: { doSite: string }) {
  const preco = usePrecoApple();
  return <span className="text-3xl font-bold">{preco ?? doSite}</span>;
}

function PrecoGoogle({ doSite }: { doSite: string }) {
  const preco = usePrecoGoogle();
  return <span className="text-3xl font-bold">{preco ?? doSite}</span>;
}

export function BotaoAssinar({ gratisAte, tatuadorId }: { gratisAte?: string; tatuadorId: string }) {
  const plataforma = usePlataforma();
  if (plataforma === null) return null;
  if (plataforma === "ios") return <AssinarPelaApple tatuadorId={tatuadorId} />;
  if (plataforma === "android") return <AssinarPeloGoogle tatuadorId={tatuadorId} />;
  return (
    <form action={assinar} className="flex flex-col gap-2">
      <Enviar classe="botao">Assinar</Enviar>
      <p className="text-xs text-muted">
        Pagamento seguro pelo Stripe, com cartão.
        {gratisAte && ` Você só é cobrado depois do período grátis (${gratisAte}).`} Cancele quando quiser.
      </p>
    </form>
  );
}

export function BotaoGerenciar({ texto = "Gerenciar assinatura" }: { texto?: string }) {
  const plataforma = usePlataforma();
  if (plataforma !== "web") return null;
  return (
    <form action={gerenciar} className="flex flex-col gap-2">
      <Enviar classe="botao-secundario">{texto}</Enviar>
      <p className="text-xs text-muted">Trocar o cartão, ver as faturas ou cancelar.</p>
    </form>
  );
}

export function BotaoGerenciarApple() {
  const plataforma = usePlataforma();
  if (plataforma === null) return null;
  return <GerenciarPelaApple noApp={plataforma === "ios"} />;
}

export function BotaoGerenciarGoogle() {
  const plataforma = usePlataforma();
  if (plataforma === null) return null;
  return <GerenciarPeloGoogle noAndroid={plataforma === "android"} />;
}
