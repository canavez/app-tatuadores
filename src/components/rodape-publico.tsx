import Link from "next/link";
import { CONTATO } from "@/lib/empresa";

/** Rodapé das páginas abertas sem login (início, termos, privacidade, suporte). */
export function RodapePublico() {
  return (
    <footer className="mt-6 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted">
      <nav aria-label="Páginas do Ravenn" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/" className="hover:text-foreground">
          Início
        </Link>
        <Link href="/suporte" className="hover:text-foreground">
          Suporte
        </Link>
        <Link href="/termos" className="hover:text-foreground">
          Termos de uso
        </Link>
        <Link href="/privacidade" className="hover:text-foreground">
          Privacidade
        </Link>
      </nav>
      <p>
        Ravenn · <a href={`mailto:${CONTATO}`} className="hover:text-foreground">{CONTATO}</a>
      </p>
    </footer>
  );
}
