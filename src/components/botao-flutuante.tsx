import Link from "next/link";
import { Plus } from "lucide-react";

/**
 * Botão "+" redondo no canto da tela, acima do menu inferior. Fica preso à moldura
 * do app (layout), não à janela — "fixed" sai do lugar no app instalado no iPhone.
 */
export function BotaoFlutuante({ href, rotulo }: { href: string; rotulo: string }) {
  return (
    <Link
      href={href}
      aria-label={rotulo}
      title={rotulo}
      className="print:hidden absolute bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-30 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/30 transition active:scale-95 md:bottom-8 md:right-[max(2rem,calc(50%-24rem+1rem))]"
    >
      <Plus className="size-7" strokeWidth={2.4} />
    </Link>
  );
}
