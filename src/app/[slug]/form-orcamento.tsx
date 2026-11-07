"use client";

import { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LOCAIS_DO_CORPO, MAX_IMAGENS } from "@/lib/orcamentos";
import { enviarOrcamento } from "./actions";

const LADO_MAXIMO = 1600;

/** Reduz a imagem para no máximo 1600 px (JPEG), no próprio aparelho: envia rápido e cabe no limite de 2 MB. */
async function prepararImagem(arquivo: File): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);
  canvas.getContext("2d")!.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  return new Promise((resolver, rejeitar) =>
    canvas.toBlob((b) => (b ? resolver(b) : rejeitar(new Error("imagem"))), "image/jpeg", 0.82),
  );
}

function novoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Navegadores antigos / endereço sem https.
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
  );
}

type Escolhida = { arquivo: File; previa: string };

export function FormOrcamento({
  tatuadorId,
  nomeTatuador,
}: {
  tatuadorId: string;
  nomeTatuador: string;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [imagens, setImagens] = useState<Escolhida[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function escolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const novas = [...(evento.target.files ?? [])].filter((a) => a.type.startsWith("image/"));
    evento.target.value = "";
    setImagens((atuais) =>
      [...atuais, ...novas.map((arquivo) => ({ arquivo, previa: URL.createObjectURL(arquivo) }))].slice(0, MAX_IMAGENS),
    );
  }

  function tirar(indice: number) {
    setImagens((atuais) => {
      URL.revokeObjectURL(atuais[indice].previa);
      return atuais.filter((_, i) => i !== indice);
    });
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formData = new FormData(evento.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      const id = novoId();
      formData.set("id", id);
      formData.set("tatuador_id", tatuadorId);
      formData.delete("arquivos");

      if (imagens.length > 0) {
        const supabase = createClient();
        const caminhos = await Promise.all(
          imagens.map(async ({ arquivo }, i) => {
            const caminho = `${tatuadorId}/orcamentos/${id}-${i + 1}.jpg`;
            const { error } = await supabase.storage
              .from("fotos")
              .upload(caminho, await prepararImagem(arquivo), { contentType: "image/jpeg" });
            if (error) throw error;
            return caminho;
          }),
        );
        for (const c of caminhos) formData.append("imagens", c);
      }

      const resultado = await enviarOrcamento(formData);
      if ("erro" in resultado) setErro(resultado.erro);
      else setEnviado(true);
    } catch {
      setErro("Não foi possível enviar as imagens. Tente outras imagens ou envie sem elas.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
        <CheckCircle2 className="size-12 text-green-400" />
        <p className="text-lg font-semibold">Pedido enviado!</p>
        <p className="text-sm text-muted">
          {nomeTatuador.split(" ")[0]} recebeu sua ideia e vai te chamar no WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <label className="campo">
        Seu nome
        <input name="nome" required maxLength={120} autoComplete="name" placeholder="Como você se chama?" />
      </label>
      <label className="campo">
        Celular (WhatsApp)
        <input
          name="telefone"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          pattern="[\d\s()+\-]{10,20}"
          title="Celular com DDD, ex.: (11) 98765-4321"
          placeholder="(11) 98765-4321"
        />
      </label>
      <label className="campo">
        Sua ideia
        <textarea
          name="descricao"
          required
          maxLength={2000}
          rows={5}
          placeholder="Descreva a tatuagem: desenho, estilo, tamanho aproximado, se é colorida..."
        />
      </label>
      <label className="campo">
        Lugar do corpo
        <select name="local_corpo" defaultValue="">
          <option value="">Escolha...</option>
          {LOCAIS_DO_CORPO.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Imagens de referência <span className="font-normal text-muted">(opcional, até {MAX_IMAGENS})</span>
        </span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {imagens.map((img, i) => (
            <div key={img.previa} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previa} alt={`Referência ${i + 1}`} className="size-full rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => tirar(i)}
                aria-label={`Tirar referência ${i + 1}`}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {imagens.length < MAX_IMAGENS && (
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-xs text-muted hover:border-accent hover:text-foreground"
            >
              <ImagePlus className="size-6" />
              Adicionar
            </button>
          )}
        </div>
        <input
          ref={entrada}
          name="arquivos"
          type="file"
          accept="image/*"
          multiple
          onChange={escolher}
          className="hidden"
          aria-label="Escolher imagens de referência"
        />
      </div>

      {/* Armadilha para robôs: escondida de quem usa a página. */}
      <input name="site" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      {erro && <p className="aviso-erro">{erro}</p>}
      <button type="submit" className="botao py-3 text-base" disabled={enviando}>
        {enviando ? "Enviando..." : "Enviar pedido de orçamento"}
      </button>
      <p className="text-center text-xs text-muted">
        Seus dados vão só para {nomeTatuador.split(" ")[0]}, para responder seu pedido.
      </p>
    </form>
  );
}
