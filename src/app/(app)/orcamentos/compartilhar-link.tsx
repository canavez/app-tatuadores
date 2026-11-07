"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Share2 } from "lucide-react";

/** Link da página com botões de copiar e compartilhar (bio do Instagram, WhatsApp...). */
export function CompartilharLink({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);
  // Só no aparelho (no servidor não existe navigator): evita diferença na hidratação.
  const podeCompartilhar = useSyncExternalStore(
    () => () => {},
    () => "share" in navigator,
    () => false,
  );

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem acesso à área de transferência: o link continua visível para copiar à mão.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a href={link} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium text-lavanda">
        {link.replace(/^https?:\/\//, "")}
      </a>
      <button type="button" onClick={copiar} className="botao-secundario shrink-0 gap-1.5 py-1.5" aria-label="Copiar link">
        {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copiado ? "Copiado" : "Copiar"}
      </button>
      {podeCompartilhar && (
        <button
          type="button"
          onClick={() => navigator.share({ url: link }).catch(() => {})}
          className="botao-secundario shrink-0 py-1.5"
          aria-label="Compartilhar link"
        >
          <Share2 className="size-4" />
        </button>
      )}
    </div>
  );
}
