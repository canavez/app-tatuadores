import Image from "next/image";
import Link from "next/link";
import { RodapePublico } from "./rodape-publico";

/** Moldura das páginas de texto abertas sem login (privacidade, termos, suporte). */
export function PaginaPublica({
  titulo,
  atualizadaEm,
  children,
}: {
  titulo: string;
  atualizadaEm?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-16 pt-[calc(env(safe-area-inset-top)+2rem)] text-sm leading-relaxed text-muted">
      <Link href="/" className="self-start">
        <Image src="/logo.png" alt="Ravenn" width={640} height={203} className="h-8 w-auto" />
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{titulo}</h1>
        {atualizadaEm && <p className="mt-1 text-xs">Atualizada em {atualizadaEm}</p>}
      </div>
      {children}
      <RodapePublico />
    </main>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-foreground">{titulo}</h2>
      {children}
    </section>
  );
}
