"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const LIMITE = 50; // px arrastados para trocar de semana

/**
 * Deixa a faixa da semana ser arrastada para os lados (dedo ou mouse):
 * para a esquerda vai para a próxima semana, para a direita volta para a anterior.
 * A rolagem vertical da página continua normal (touch-action: pan-y).
 */
export function ArrastarSemana({
  anterior,
  proxima,
  children,
}: {
  anterior: string;
  proxima: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const arrastou = useRef(false);
  // Guardado também num ref: o "soltar" pode vir antes de a tela redesenhar o último movimento.
  const ultimo = useRef(0);
  const [deslocamento, setDeslocamento] = useState(0);
  const [soltando, setSoltando] = useState(false);

  // Deixa as semanas vizinhas carregadas, para a troca ser imediata.
  useEffect(() => {
    router.prefetch(anterior);
    router.prefetch(proxima);
  }, [router, anterior, proxima]);

  function comecar(e: React.PointerEvent) {
    inicio.current = { x: e.clientX, y: e.clientY };
    arrastou.current = false;
    ultimo.current = 0;
    setSoltando(false);
  }

  function mover(e: React.PointerEvent) {
    if (!inicio.current) return;
    const dx = e.clientX - inicio.current.x;
    const dy = e.clientY - inicio.current.y;
    if (!arrastou.current && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      arrastou.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (arrastou.current) {
      ultimo.current = dx;
      setDeslocamento(dx);
    }
  }

  function soltar() {
    if (!inicio.current) return;
    inicio.current = null;
    setSoltando(true);
    if (ultimo.current <= -LIMITE) router.push(proxima);
    else if (ultimo.current >= LIMITE) router.push(anterior);
    setDeslocamento(0);
  }

  return (
    <div
      className="min-w-0 flex-1 touch-pan-y select-none"
      onPointerDown={comecar}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      // Sem isso, segurar um dia com o mouse começa a "arrastar o link" do navegador.
      onDragStart={(e) => e.preventDefault()}
      // Um arraste não pode virar toque no dia que estava embaixo do dedo.
      onClickCapture={(e) => {
        if (arrastou.current) {
          e.preventDefault();
          e.stopPropagation();
          arrastou.current = false;
        }
      }}
    >
      <div
        style={{
          transform: `translateX(${deslocamento}px)`,
          opacity: 1 - Math.min(Math.abs(deslocamento) / 300, 0.5),
          transition: soltando ? "transform 180ms ease-out, opacity 180ms ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
