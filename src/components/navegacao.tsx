"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Package, Sun, UserRound, Users, Wallet, type LucideIcon } from "lucide-react";

const ABAS: { href: string; rotulo: string; Icone: LucideIcon }[] = [
  { href: "/hoje", rotulo: "Hoje", Icone: Sun },
  { href: "/agenda", rotulo: "Agenda", Icone: CalendarDays },
  { href: "/clientes", rotulo: "Clientes", Icone: Users },
  { href: "/financeiro", rotulo: "Financeiro", Icone: Wallet },
  { href: "/estoque", rotulo: "Estoque", Icone: Package },
  { href: "/conta", rotulo: "Conta", Icone: UserRound },
];

function useAbaAtiva() {
  const caminho = usePathname();
  return (href: string) => caminho === href || caminho.startsWith(`${href}/`);
}

/**
 * Abas no rodapé (celular). Fica por cima do fim do conteúdo, translúcida (o conteúdo
 * passa borrado por trás), e um fundinho desliza até a aba escolhida.
 */
export function MenuInferior() {
  const ativa = useAbaAtiva();
  const indice = ABAS.findIndex((a) => ativa(a.href));
  return (
    <nav
      aria-label="Menu principal"
      className="absolute inset-x-0 bottom-0 z-20 border-t border-white/5 bg-surface/75 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 print:hidden md:hidden"
    >
      <ul className="relative mx-auto grid max-w-md grid-cols-6 px-1">
        {/* Fundinho da aba ativa: desliza de uma aba para outra. */}
        <li
          aria-hidden
          className={`pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/6)] rounded-xl bg-accent/15 transition-[translate,opacity] duration-300 ease-[cubic-bezier(.3,1.3,.5,1)] ${
            indice < 0 ? "opacity-0" : "opacity-100"
          }`}
          style={{ translate: `${Math.max(indice, 0) * 100}% 0` }}
        />
        {ABAS.map(({ href, rotulo, Icone }) => (
          <li key={href} className="relative">
            <Link
              href={href}
              transitionTypes={["aba"]}
              aria-current={ativa(href) ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors active:scale-95 ${
                ativa(href) ? "text-lavanda" : "text-muted"
              }`}
            >
              <Icone
                key={ativa(href) ? "ativa" : "normal"}
                className={`size-6 ${ativa(href) ? "aba-pulo" : ""}`}
                strokeWidth={ativa(href) ? 2.2 : 1.8}
              />
              {rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Barra superior com as abas (computador). */
export function MenuSuperior() {
  const ativa = useAbaAtiva();
  return (
    <header className="hidden shrink-0 print:hidden border-b border-border bg-surface md:block">
      <div className="mx-auto flex max-w-3xl items-center gap-8 px-6 py-3">
        <Link href="/hoje">
          <Image src="/logo.png" alt="Ravenn" width={640} height={203} className="h-7 w-auto" />
        </Link>
        <nav aria-label="Menu principal" className="flex gap-1">
          {ABAS.map(({ href, rotulo, Icone }) => (
            <Link
              key={href}
              href={href}
              transitionTypes={["aba"]}
              aria-current={ativa(href) ? "page" : undefined}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                ativa(href) ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              <Icone className="size-4" />
              {rotulo}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
