"use client";

import { ViewTransition, useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Animação ao trocar de tela (View Transitions do navegador, via React):
 * - abrir uma tela (padrão): a nova entra deslizando da direita, como no iPhone;
 * - seta de voltar (transitionTypes "voltar"): a anterior volta pela esquerda;
 * - abas do menu (transitionTypes "aba"): troca suave, sem deslizar.
 * Mudar só o "?dia=" ou "?aba=" na mesma tela não anima (o endereço é o mesmo).
 * Em navegador sem suporte, a tela só troca, como antes.
 */
export function TransicaoDeTela({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();

  // Marca que o app já está rodando: daqui em diante as telas chegam pela navegação
  // (o NumeroAnimado só conta nesses casos).
  useEffect(() => {
    document.documentElement.dataset.navegou = "1";
  }, []);

  return (
    <ViewTransition
      key={caminho}
      enter={{ voltar: "tela-voltar", aba: "tela-aba", default: "tela-ir" }}
      exit={{ voltar: "tela-voltar", aba: "tela-aba", default: "tela-ir" }}
      update="none"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
