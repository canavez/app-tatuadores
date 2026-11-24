import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = {
  Icone: LucideIcon;
  titulo: string;
  texto?: string;
  /** Botão do próximo passo (ex.: "Cadastrar o primeiro"). */
  acao?: { href: string; rotulo: string; Icone?: LucideIcon };
  /** Versão menor, para listas dentro de uma tela (ex.: tatuagens do cliente). */
  compacto?: boolean;
};

/** Tela vazia: ícone num quadrado lavanda, uma frase amigável e o próximo passo. */
export function Vazio({ Icone, titulo, texto, acao, compacto = false }: Props) {
  return (
    <div className={`card flex flex-col items-center gap-2 text-center ${compacto ? "py-6" : "py-10"}`}>
      <span
        aria-hidden
        className={`vazio-icone mb-1 flex items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgb(212_208_234/0.22),rgb(127_121_185/0.10))] text-lavanda ${
          compacto ? "size-12" : "size-16"
        }`}
      >
        <Icone className={compacto ? "size-6" : "size-8"} strokeWidth={1.6} />
      </span>
      <p className="font-semibold text-balance">{titulo}</p>
      {texto && <p className="max-w-xs text-sm text-balance text-muted">{texto}</p>}
      {acao && (
        <Link href={acao.href} className="botao mt-2 gap-2">
          {acao.Icone && <acao.Icone className="size-4" />}
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}
