"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { AVISOS, COOKIE_AVISO, type Aviso } from "@/lib/avisos";

const EVENTO = "ravenn:aviso";

/** Mostra o balão de aviso a partir do navegador (ex.: depois de um formulário que não muda de tela). */
export function mostrarAviso(texto: string) {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: texto }));
}

/** Num formulário com useActionState: mostra a "mensagem" de sucesso no balão a cada envio. */
export function useAvisoDoForm(estado: { mensagem?: string } | undefined) {
  useEffect(() => {
    if (estado?.mensagem) mostrarAviso(estado.mensagem);
  }, [estado]);
}

function lerCookie(): string | null {
  const achado = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_AVISO}=`));
  if (!achado) return null;
  document.cookie = `${COOKIE_AVISO}=; path=/; max-age=0`;
  const chave = decodeURIComponent(achado.slice(COOKIE_AVISO.length + 1)) as Aviso;
  return AVISOS[chave] ?? null;
}

/**
 * Balão que sobe de baixo com "Sessão salva", fica uns 2,5 s e some (animação em globals.css). O aviso chega por
 * um cookie que a server action deixa (lib/aviso.ts) ou por mostrarAviso().
 */
export function Avisos() {
  const caminho = usePathname();
  // "vez" muda a cada aviso: o balão monta de novo e a animação recomeça.
  const [aviso, setAviso] = useState<{ texto: string; vez: number } | null>(null);

  useEffect(() => {
    const mostrar = (texto: string) => setAviso((a) => ({ texto, vez: (a?.vez ?? 0) + 1 }));
    const conferir = () => {
      const t = lerCookie();
      if (t) mostrar(t);
    };
    const doEvento = (e: Event) => mostrar((e as CustomEvent<string>).detail);
    conferir();
    // A action pode voltar para a mesma tela (sem mudar o endereço): confere de tempos em tempos.
    const intervalo = setInterval(conferir, 400);
    window.addEventListener(EVENTO, doEvento);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener(EVENTO, doEvento);
    };
  }, [caminho]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-40 flex justify-center px-4 print:hidden md:bottom-8"
    >
      {aviso && (
        <div
          key={aviso.vez}
          role="status"
          onAnimationEnd={() => setAviso(null)}
          className="balao-aviso flex items-center gap-2.5 rounded-2xl border border-accent/40 bg-surface-alto px-4 py-3 text-sm font-medium shadow-xl shadow-black/50"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-green-500/15 text-green-400">
            <Check className="size-4" strokeWidth={2.6} />
          </span>
          {aviso.texto}
        </div>
      )}
    </div>
  );
}
