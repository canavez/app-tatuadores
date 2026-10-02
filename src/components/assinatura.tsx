"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";

/**
 * Quadro para assinar com o dedo (ou mouse).
 * A assinatura vai para o formulário como PNG em um campo escondido.
 */
export function Assinatura({ name }: { name: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const [imagem, setImagem] = useState("");

  // Ajusta a resolução do quadro ao tamanho da tela (fica nítido em celulares).
  useEffect(() => {
    const canvas = canvasRef.current!;
    const escala = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * escala;
    canvas.height = height * escala;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(escala, escala);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
  }, []);

  function posicao(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function comecar(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    desenhando.current = true;
    ultimo.current = posicao(e);
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current || !ultimo.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const atual = posicao(e);
    ctx.beginPath();
    ctx.moveTo(ultimo.current.x, ultimo.current.y);
    ctx.lineTo(atual.x, atual.y);
    ctx.stroke();
    ultimo.current = atual;
  }

  function terminar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current) return;
    desenhando.current = false;
    ultimo.current = null;
    setImagem(e.currentTarget.toDataURL("image/png"));
  }

  function limpar() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setImagem("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          aria-label="Quadro de assinatura"
          onPointerDown={comecar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
          className="h-44 w-full touch-none rounded-xl border-2 border-dashed border-border bg-white"
        />
        {!imagem && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
            Assine aqui com o dedo
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-zinc-300" />
      </div>
      <button
        type="button"
        onClick={limpar}
        className="flex items-center gap-1 self-end text-sm text-muted underline"
      >
        <Eraser className="size-4" />
        Limpar assinatura
      </button>
      <input type="hidden" name={name} value={imagem} />
    </div>
  );
}
