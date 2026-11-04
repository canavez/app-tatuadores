"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PRODUTO_APPLE } from "@/lib/empresa";

// Assinatura pelo app do iPhone, com a compra da App Store (a Apple exige isso dentro do app).
// O plugin só existe no app instalado; no site estas partes não aparecem.

async function plugin() {
  const { NativePurchases, PURCHASE_TYPE } = await import("@capgo/native-purchases");
  return { NativePurchases, SUBS: PURCHASE_TYPE.SUBS };
}

/** Preço como a App Store mostra para a pessoa (a Apple pede que venha dela, não fixo no app). */
export function usePrecoApple() {
  const [preco, setPreco] = useState<string | null>(null);
  useEffect(() => {
    plugin()
      .then(({ NativePurchases, SUBS }) =>
        NativePurchases.getProduct({ productIdentifier: PRODUTO_APPLE, productType: SUBS }),
      )
      .then(({ product }) => setPreco(product.priceString))
      .catch(() => setPreco(null));
  }, []);
  return preco;
}

/** Versões antigas do app (instaladas antes da compra pela Apple) não têm o plugin. */
function useAppTemCompra() {
  const [tem, setTem] = useState<boolean | null>(null);
  useEffect(() => {
    import("@capacitor/core")
      .then(({ Capacitor }) => setTem(Capacitor.isPluginAvailable("NativePurchases")))
      .catch(() => setTem(false));
  }, []);
  return tem;
}

/** Manda a compra assinada pela Apple para o servidor, que confere e libera o acesso. */
async function enviarCompra(jws: string | undefined) {
  if (!jws) throw new Error("A Apple não devolveu a compra. Tente \"Restaurar compras\".");
  const resposta = await fetch("/api/apple/compra", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jws }),
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(corpo.erro ?? "Não foi possível confirmar a assinatura.");
}

const cancelou = (erro: unknown) => erro instanceof Error && /cancel/i.test(erro.message);

export function AssinarPelaApple({ tatuadorId }: { tatuadorId: string }) {
  const temCompra = useAppTemCompra();
  if (temCompra === null) return null;
  if (!temCompra) {
    return <p className="text-xs text-muted">Atualize o app Ravenn na App Store para assinar pelo iPhone.</p>;
  }
  return <Comprar tatuadorId={tatuadorId} />;
}

function Comprar({ tatuadorId }: { tatuadorId: string }) {
  const router = useRouter();
  const preco = usePrecoApple();
  const [ocupado, setOcupado] = useState<"assinar" | "restaurar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function assinar() {
    setOcupado("assinar");
    setErro(null);
    setAviso(null);
    try {
      const { NativePurchases, SUBS } = await plugin();
      const compra = await NativePurchases.purchaseProduct({
        productIdentifier: PRODUTO_APPLE,
        productType: SUBS,
        quantity: 1,
        // Liga a compra a esta conta do Ravenn (o id da conta já é no formato que a Apple pede).
        appAccountToken: tatuadorId,
      });
      await enviarCompra(compra.jwsRepresentation);
      router.refresh();
    } catch (e) {
      if (!cancelou(e)) setErro(e instanceof Error ? e.message : "Não foi possível assinar.");
    } finally {
      setOcupado(null);
    }
  }

  async function restaurar() {
    setOcupado("restaurar");
    setErro(null);
    setAviso(null);
    try {
      const { NativePurchases, SUBS } = await plugin();
      await NativePurchases.restorePurchases();
      const { purchases } = await NativePurchases.getPurchases({ productType: SUBS });
      const doRavenn = purchases.filter((p) => p.productIdentifier === PRODUTO_APPLE && p.jwsRepresentation);
      if (doRavenn.length === 0) {
        setAviso("Nenhuma assinatura do Ravenn encontrada neste ID Apple.");
        return;
      }
      for (const compra of doRavenn) await enviarCompra(compra.jwsRepresentation);
      router.refresh();
    } catch (e) {
      if (!cancelou(e)) setErro(e instanceof Error ? e.message : "Não foi possível restaurar.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {erro && <p className="aviso-erro">{erro}</p>}
      {aviso && <p className="text-sm text-muted">{aviso}</p>}
      <button type="button" className="botao" onClick={assinar} disabled={ocupado !== null || !preco}>
        {ocupado === "assinar" ? "Abrindo…" : preco ? `Assinar por ${preco}/mês` : "Carregando…"}
      </button>
      <button type="button" className="botao-secundario" onClick={restaurar} disabled={ocupado !== null}>
        {ocupado === "restaurar" ? "Procurando…" : "Restaurar compras"}
      </button>
      <p className="text-xs text-muted">
        Assinatura mensal do Ravenn{preco ? ` por ${preco}` : ""}, cobrada na sua conta Apple. Renova sozinha
        todo mês, a não ser que você desligue a renovação até 24 horas antes do fim do período, em Ajustes →
        seu nome → Assinaturas. Veja os{" "}
        <Link href="/termos" className="underline">
          termos de uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="underline">
          política de privacidade
        </Link>
        .
      </p>
    </div>
  );
}

/** Quem assinou pela Apple gerencia (cancela, troca forma de pagamento) na própria Apple. */
export function GerenciarPelaApple({ noApp }: { noApp: boolean }) {
  const [erro, setErro] = useState(false);
  if (!noApp) {
    return (
      <p className="text-sm text-muted">
        Você assinou pelo app do iPhone. Para cancelar ou trocar a forma de pagamento, no iPhone abra Ajustes →
        seu nome → Assinaturas → Ravenn.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="botao-secundario"
        onClick={() =>
          plugin()
            .then(({ NativePurchases }) => NativePurchases.manageSubscriptions())
            .catch(() => setErro(true))
        }
      >
        Gerenciar assinatura
      </button>
      <p className="text-xs text-muted">
        {erro
          ? "Não abriu. No iPhone: Ajustes → seu nome → Assinaturas → Ravenn."
          : "Cancelar ou trocar a forma de pagamento, na App Store."}
      </p>
    </div>
  );
}
