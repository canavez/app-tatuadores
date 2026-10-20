"use client";

import { useState } from "react";
import { FileDown, ImageDown } from "lucide-react";

/**
 * "Baixar PDF" abre a impressão do navegador (onde se escolhe "Salvar como PDF");
 * "Salvar imagem" gera um PNG do relatório, bom para mandar no WhatsApp.
 */
export function Exportar({ nomeArquivo }: { nomeArquivo: string }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  async function salvarImagem() {
    const relatorio = document.getElementById("relatorio");
    if (!relatorio) return;
    setGerando(true);
    setErro(false);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(relatorio, { pixelRatio: 2, backgroundColor: "#0b0b12", cacheBust: true });
      const link = document.createElement("a");
      link.href = url;
      link.download = `${nomeArquivo}.png`;
      link.click();
    } catch {
      setErro(true);
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 print:hidden">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => window.print()} className="botao gap-2 py-2.5">
          <FileDown className="size-4" />
          Baixar PDF
        </button>
        <button type="button" onClick={salvarImagem} disabled={gerando} className="botao-secundario gap-2 py-2.5">
          <ImageDown className="size-4" />
          {gerando ? "Gerando..." : "Salvar imagem"}
        </button>
      </div>
      {erro && <p className="aviso-erro">Não foi possível gerar a imagem. Tente o PDF.</p>}
      <p className="text-xs text-muted">
        No PDF, escolha &quot;Salvar como PDF&quot; como impressora. No celular, a opção fica em Compartilhar.
      </p>
    </div>
  );
}
