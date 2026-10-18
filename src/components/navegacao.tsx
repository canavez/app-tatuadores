"use client";

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

/** Abas fixas no rodapé (celular). */
export function MenuInferior() {
  const ativa = useAbaAtiva();
  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-30 print:hidden border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-6">
        {ABAS.map(({ href, rotulo, Icone }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={ativa(href) ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
                ativa(href) ? "text-accent" : "text-muted"
              }`}
            >
              <Icone className="size-6" strokeWidth={ativa(href) ? 2.4 : 1.8} />
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
    <header className="sticky top-0 z-30 hidden print:hidden border-b border-border bg-surface/90 backdrop-blur md:block">
      <div className="mx-auto flex max-w-3xl items-center gap-8 px-6 py-3">
        <Link href="/hoje" className="flex items-center gap-2 font-bold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icone-192.png" alt="" className="size-7 rounded-lg" />
          Ravenn
        </Link>
        <nav aria-label="Menu principal" className="flex gap-1">
          {ABAS.map(({ href, rotulo, Icone }) => (
            <Link
              key={href}
              href={href}
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
