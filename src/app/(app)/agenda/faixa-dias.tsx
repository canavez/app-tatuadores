"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DiaDaFaixa = {
  data: string;
  curto: string; // "seg"
  numero: number;
  rotulo: string; // "segunda-feira, 12 de outubro"
  temSessao: boolean;
};

/**
 * Faixa de dias que corre como um carrossel: arrastar (dedo ou mouse) anda dia a dia,
 * e as setas pulam uma semana. Rolar não muda o dia escolhido — só tocar num dia.
 *
 * `inicio` é a posição da segunda-feira da semana do dia escolhido. Os dias antes dela
 * só entram depois que a página carrega (já rolados para fora da tela), para a faixa
 * nunca aparecer, nem por um instante, semanas atrás.
 */
export function FaixaDias({
  dias,
  inicio,
  dia,
  hoje,
}: {
  dias: DiaDaFaixa[];
  inicio: number;
  dia: string;
  hoje: string;
}) {
  const faixa = useRef<HTMLOListElement>(null);
  const [comAnteriores, setComAnteriores] = useState(false);
  const visiveis = comAnteriores ? dias : dias.slice(inicio);
  // Primeiro dia à vista, para a faixa não pular quando se escolhe um dia.
  const primeiroVisivel = useRef<string | null>(null);
  const arraste = useRef<{ x: number; rolagem: number; arrastou: boolean } | null>(null);
  const cliqueBloqueado = useRef(false);
  const alvo = useRef<number | null>(null); // dia para onde a faixa está rolando
  const religar = useRef<ReturnType<typeof setTimeout>>(undefined);

  function passo() {
    const itens = faixa.current?.children;
    if (!itens || itens.length < 2) return 1;
    // Com frações de pixel (offsetLeft arredonda, e o erro somado pulava um dia).
    return itens[1].getBoundingClientRect().left - itens[0].getBoundingClientRect().left;
  }

  // De propósito: renderiza de novo antes de pintar, já com a rolagem no lugar.
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setComAnteriores(true);
  }, []);

  // Posiciona a faixa: mantém os dias que já estavam à vista, se o dia escolhido está entre
  // eles; senão, mostra a semana do dia escolhido.
  useLayoutEffect(() => {
    const el = faixa.current;
    if (!el || !comAnteriores) return;
    const indice = (data: string) => dias.findIndex((d) => d.data === data);
    const atual = primeiroVisivel.current ? indice(primeiroVisivel.current) : -1;
    const indiceDia = indice(dia);
    const manter = atual >= 0 && indiceDia >= atual && indiceDia < atual + 7;
    el.scrollLeft = (manter ? atual : inicio) * passo();
    primeiroVisivel.current = dias[manter ? atual : inicio].data;
  }, [comAnteriores, dias, dia, inicio]);

  function aoRolar() {
    const el = faixa.current;
    if (!el || !comAnteriores) return;
    const i = Math.round(el.scrollLeft / passo());
    primeiroVisivel.current = visiveis[Math.min(Math.max(i, 0), visiveis.length - 1)].data;
  }

  // Rola suave até um dia. O encaixe automático fica desligado durante a animação,
  // senão ele briga com ela (ex.: clicar na seta enquanto a faixa ainda se ajeita).
  function rolarPara(indice: number) {
    const el = faixa.current;
    if (!el) return;
    alvo.current = Math.min(Math.max(indice, 0), visiveis.length - 7);
    el.style.scrollSnapType = "none";
    el.scrollTo({ left: alvo.current * passo(), behavior: "smooth" });
    clearTimeout(religar.current);
    religar.current = setTimeout(() => {
      el.style.scrollSnapType = "";
      alvo.current = null;
    }, 500);
  }

  function pularSemana(e: React.MouseEvent, sentido: 1 | -1) {
    e.preventDefault(); // sem JS, o link troca de semana pela URL
    const el = faixa.current;
    if (!el) return;
    const atual = alvo.current ?? Math.round(el.scrollLeft / passo());
    rolarPara(atual + sentido * 7);
  }

  // No celular a rolagem é a nativa. Com mouse, arrastar também rola.
  function comecar(e: React.PointerEvent<HTMLOListElement>) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    arraste.current = { x: e.clientX, rolagem: e.currentTarget.scrollLeft, arrastou: false };
  }

  function mover(e: React.PointerEvent<HTMLOListElement>) {
    const a = arraste.current;
    if (!a) return;
    const dx = e.clientX - a.x;
    if (!a.arrastou && Math.abs(dx) > 5) {
      a.arrastou = true;
      e.currentTarget.style.scrollSnapType = "none";
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (a.arrastou) e.currentTarget.scrollLeft = a.rolagem - dx;
  }

  function soltar(e: React.PointerEvent<HTMLOListElement>) {
    const a = arraste.current;
    arraste.current = null;
    if (!a?.arrastou) return;
    cliqueBloqueado.current = true;
    rolarPara(Math.round(e.currentTarget.scrollLeft / passo()));
  }

  const botaoSeta =
    "flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface";

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/agenda?dia=${dias[Math.max(inicio - 7, 0)].data}`}
        onClick={(e) => pularSemana(e, -1)}
        aria-label="Semana anterior"
        className={botaoSeta}
      >
        <ChevronLeft className="size-5" />
      </Link>
      <ol
        ref={faixa}
        onScroll={aoRolar}
        onPointerDown={comecar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        // Sem isso, segurar um dia com o mouse começa a "arrastar o link" do navegador.
        onDragStart={(e) => e.preventDefault()}
        // Um arraste não pode virar clique no dia que estava embaixo do mouse.
        onClickCapture={(e) => {
          if (cliqueBloqueado.current) {
            e.preventDefault();
            e.stopPropagation();
            cliqueBloqueado.current = false;
          }
        }}
        className="sem-barra grid min-w-0 flex-1 snap-x snap-mandatory auto-cols-[calc((100%-1.5rem)/7)] grid-flow-col gap-1 overflow-x-auto overscroll-x-contain select-none"
      >
        {visiveis.map((d) => {
          const selecionado = d.data === dia;
          const ehHoje = d.data === hoje;
          return (
            <li key={d.data} className="snap-start">
              <Link
                href={`/agenda?dia=${d.data}`}
                prefetch={false}
                aria-label={d.rotulo}
                aria-current={selecionado ? "date" : undefined}
                className={`flex flex-col items-center rounded-2xl py-2 transition ${
                  selecionado
                    ? "bg-accent text-accent-foreground"
                    : ehHoje
                      ? "text-accent"
                      : "hover:bg-surface"
                }`}
              >
                <span className={`text-[11px] uppercase ${selecionado ? "" : "text-muted"}`}>
                  {d.curto}
                </span>
                <span className="text-lg font-semibold tabular-nums">{d.numero}</span>
                <span
                  className={`mt-0.5 size-1.5 rounded-full ${
                    d.temSessao
                      ? selecionado
                        ? "bg-accent-foreground"
                        : "bg-accent"
                      : "bg-transparent"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ol>
      <Link
        href={`/agenda?dia=${dias[Math.min(inicio + 7, dias.length - 1)].data}`}
        onClick={(e) => pularSemana(e, 1)}
        aria-label="Próxima semana"
        className={botaoSeta}
      >
        <ChevronRight className="size-5" />
      </Link>
    </div>
  );
}
