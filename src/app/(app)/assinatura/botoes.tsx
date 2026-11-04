"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { assinar, gerenciar } from "./actions";
import { AssinarPelaApple, GerenciarPelaApple, usePrecoApple } from "./apple";

/**
 * No app do iPhone a Apple não deixa vender assinatura por fora da App Store (nem pôr
 * botão ou link para pagar no site). Lá a compra é pela Apple; no site (ravenn.me), pelo Stripe.
 */
function useNoApp() {
  const [noApp, setNoApp] = useState<boolean | null>(null);
  useEffect(() => {
    import("@capacitor/core")
      .then(({ Capacitor }) => setNoApp(Capacitor.isNativePlatform()))
      .catch(() => setNoApp(false));
  }, []);
  return noApp;
}

function Enviar({ children, classe }: { children: React.ReactNode; classe: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={classe} disabled={pending}>
      {pending ? "Abrindo…" : children}
    </button>
  );
}

/** Preço do card: no app, o que a App Store mostra; no site, o preço do Stripe. */
export function Preco({ doSite }: { doSite: string }) {
  const noApp = useNoApp();
  if (noApp === null) return <span className="text-3xl font-bold">&nbsp;</span>;
  return noApp ? <PrecoApple doSite={doSite} /> : <span className="text-3xl font-bold">{doSite}</span>;
}

function PrecoApple({ doSite }: { doSite: string }) {
  const preco = usePrecoApple();
  return <span className="text-3xl font-bold">{preco ?? doSite}</span>;
}

export function BotaoAssinar({ gratisAte, tatuadorId }: { gratisAte?: string; tatuadorId: string }) {
  const noApp = useNoApp();
  if (noApp === null) return null;
  if (noApp) return <AssinarPelaApple tatuadorId={tatuadorId} />;
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
  const noApp = useNoApp();
  if (noApp !== false) return null;
  return (
    <form action={gerenciar} className="flex flex-col gap-2">
      <Enviar classe="botao-secundario">{texto}</Enviar>
      <p className="text-xs text-muted">Trocar o cartão, ver as faturas ou cancelar.</p>
    </form>
  );
}

export function BotaoGerenciarApple() {
  const noApp = useNoApp();
  if (noApp === null) return null;
  return <GerenciarPelaApple noApp={noApp} />;
}
