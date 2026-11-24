"use client";

import { Printer } from "lucide-react";
import { imprimir } from "@/lib/celular";

export function BotaoImprimir() {
  return (
    <button type="button" onClick={() => imprimir()} className="botao-secundario gap-2 py-3 sm:py-2">
      <Printer className="size-4" />
      Imprimir / salvar PDF
    </button>
  );
}
