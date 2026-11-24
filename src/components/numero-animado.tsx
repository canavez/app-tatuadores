"use client";

import { useLayoutEffect, useRef } from "react";
import { reais } from "@/lib/financeiro";

/**
 * Valor em reais que sobe contando de zero até o valor certo (uns 0,8 s) quando a tela abre.
 * Na primeira carga da página (o HTML que vem do servidor) não anima, para não piscar
 * o valor e voltar a zero; anima ao chegar pela navegação do app. Sem animação para quem
 * pediu menos movimento no celular.
 */
export function NumeroAnimado({ valor, className }: { valor: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !document.documentElement.dataset.navegou) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let quadro = 0;
    const inicio = performance.now();
    const duracao = 800;
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracao);
      const suave = 1 - Math.pow(1 - t, 3);
      el.textContent = reais(t === 1 ? valor : Math.round(valor * suave * 100) / 100);
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    el.textContent = reais(0);
    quadro = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(quadro);
      el.textContent = reais(valor);
    };
  }, [valor]);

  return (
    <span ref={ref} className={className}>
      {reais(valor)}
    </span>
  );
}
