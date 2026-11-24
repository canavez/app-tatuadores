"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PLANO_GOOGLE, PRODUTO_GOOGLE } from "@/lib/empresa";

// Assinatura pelo app de Android, com a compra do Google Play (o Google exige isso dentro do app).
// O plugin é o mesmo do iPhone; no site estas partes não aparecem.

async function plugin() {
  const { NativePurchases, PURCHASE_TYPE } = await import("@capgo/native-purchases");
  return { NativePurchases, SUBS: PURCHASE_TYPE.SUBS };
}

/** Preço como o Google Play mostra para a pessoa (vem da loja, não fixo no app). */
export function usePrecoGoogle() {
  const [preco, setPreco] = useState<string | null>(null);
  useEffect(() => {
    plugin()
      .then(({ NativePurchases, SUBS }) =>
        NativePurchases.getProduct({ productIdentifier: PRODUTO_GOOGLE, productType: SUBS }),
      )
      .then(({ product }) => setPreco(product.priceString))
      .catch(() => setPreco(null));
  }, []);
  return preco;
}

/** Manda o token da compra para o servidor, que confere com o Google e libera o acesso. */
async function enviarCompra(token: string | undefined) {
  if (!token) throw new Error("O Google Play não devolveu a compra. Tente \"Restaurar compras\".");
  const resposta = await fetch("/api/google/compra", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(corpo.erro ?? "Não foi possível confirmar a assinatura.");
}

const cancelou = (erro: unknown) => erro instanceof Error && /cancel/i.test(erro.message);

export function AssinarPeloGoogle({ tatuadorId }: { tatuadorId: string }) {
  const router = useRouter();
  const preco = usePrecoGoogle();
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
        productIdentifier: PRODUTO_GOOGLE,
        planIdentifier: PLANO_GOOGLE,
        productType: SUBS,
        // Liga a compra a esta conta do Ravenn (o Google guarda como "id da conta").
        appAccountToken: tatuadorId,
      });
      await enviarCompra(compra.purchaseToken);
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
      const { purchases } = await NativePurchases.getPurchases({ productType: SUBS });
      const doRavenn = purchases.filter((p) => p.productIdentifier === PRODUTO_GOOGLE && p.purchaseToken);
      if (doRavenn.length === 0) {
        setAviso("Nenhuma assinatura do Ravenn encontrada nesta conta Google.");
        return;
      }
      for (const compra of doRavenn) await enviarCompra(compra.purchaseToken);
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
        Assinatura mensal do Ravenn{preco ? ` por ${preco}` : ""}, cobrada na sua conta Google Play. Renova sozinha
        todo mês até você cancelar, no app Play Store → seu perfil → Pagamentos e assinaturas → Assinaturas. Veja
        os{" "}
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

/** Quem assinou pelo Google Play gerencia (cancela, troca forma de pagamento) na própria Play Store. */
export function GerenciarPeloGoogle({ noAndroid }: { noAndroid: boolean }) {
  const [erro, setErro] = useState(false);
  if (!noAndroid) {
    return (
      <p className="text-sm text-muted">
        Você assinou pelo app de Android. Para cancelar ou trocar a forma de pagamento, abra a Play Store → seu
        perfil → Pagamentos e assinaturas → Assinaturas → Ravenn.
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
          ? "Não abriu. Na Play Store: seu perfil → Pagamentos e assinaturas → Assinaturas → Ravenn."
          : "Cancelar ou trocar a forma de pagamento, na Play Store."}
      </p>
    </div>
  );
}
