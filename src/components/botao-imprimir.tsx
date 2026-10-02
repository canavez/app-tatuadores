"use client";

import { Printer } from "lucide-react";

export function BotaoImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="botao-secundario gap-2 py-3 sm:py-2">
      <Printer className="size-4" />
      Imprimir / salvar PDF
    </button>
  );
}
