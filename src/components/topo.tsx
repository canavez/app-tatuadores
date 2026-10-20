import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  titulo: string;
  /** Mostra a seta de voltar para este endereço. */
  voltar?: string;
  /** Texto pequeno acima do título. */
  subtitulo?: string;
  /** Botões à direita (ex.: Editar). */
  acoes?: React.ReactNode;
};

/** Cabeçalho de cada tela, no estilo de app: voltar, título e ações. */
export function Topo({ titulo, voltar, subtitulo, acoes }: Props) {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-border bg-background px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:pt-0 print:static print:border-0">
      <div className="flex min-h-10 items-center gap-2">
        {voltar && (
          <Link
            href={voltar}
            aria-label="Voltar"
            className="-ml-2 flex size-10 shrink-0 print:hidden items-center justify-center rounded-full text-foreground hover:bg-surface"
          >
            <ChevronLeft className="size-6" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {subtitulo && (
            <p className="truncate text-xs text-muted first-letter:uppercase">{subtitulo}</p>
          )}
          <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">{titulo}</h1>
        </div>
        {acoes && <div className="flex shrink-0 items-center gap-1 print:hidden">{acoes}</div>}
      </div>
    </div>
  );
}

/** Botão redondo de ícone para usar em `acoes`. */
export function BotaoIcone({
  href,
  rotulo,
  children,
}: {
  href: string;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={rotulo}
      title={rotulo}
      className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-surface"
    >
      {children}
    </Link>
  );
}
