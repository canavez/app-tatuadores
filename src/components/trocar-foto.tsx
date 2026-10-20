"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { salvarFoto } from "@/app/(app)/fotos-actions";
import { Avatar } from "./avatar";

const LADO = 512;

/** Recorta a foto no centro em quadrado e reduz para 512 px (JPEG), no próprio aparelho. */
async function prepararFoto(arquivo: File): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo);
  const lado = Math.min(imagem.width, imagem.height);
  const canvas = document.createElement("canvas");
  canvas.width = LADO;
  canvas.height = LADO;
  canvas
    .getContext("2d")!
    .drawImage(imagem, (imagem.width - lado) / 2, (imagem.height - lado) / 2, lado, lado, 0, 0, LADO, LADO);
  return new Promise((resolver, rejeitar) =>
    canvas.toBlob((b) => (b ? resolver(b) : rejeitar(new Error("foto"))), "image/jpeg", 0.85),
  );
}

type Props = {
  nome: string;
  fotoUrl: string | null;
  /** Foto de um cliente ou do próprio tatuador. */
  alvo: { cliente: string } | "perfil";
};

/** Avatar grande que, ao tocar, deixa escolher uma foto (câmera ou galeria). */
export function TrocarFoto({ nome, fotoUrl, alvo }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("sessão");
      const caminho = alvo === "perfil" ? `${user.id}/perfil.jpg` : `${user.id}/clientes/${alvo.cliente}.jpg`;
      const { error } = await supabase.storage
        .from("fotos")
        .upload(caminho, await prepararFoto(arquivo), { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      await salvarFoto(alvo, caminho);
      router.refresh();
    } catch {
      setErro("Não foi possível enviar a foto. Tente outra imagem.");
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    setEnviando(true);
    await salvarFoto(alvo, null);
    router.refresh();
    setEnviando(false);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={enviando}
        aria-label={fotoUrl ? "Trocar foto" : "Adicionar foto"}
        className="relative rounded-full disabled:opacity-60"
      >
        <Avatar nome={nome} foto={fotoUrl} tamanho="grande" />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-background bg-accent text-white">
          <Camera className="size-3.5" />
        </span>
      </button>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        onChange={escolher}
        className="hidden"
        aria-label="Escolher foto"
      />
      {fotoUrl && !enviando && (
        <button type="button" onClick={remover} className="text-[11px] text-muted underline">
          Remover
        </button>
      )}
      {enviando && <span className="text-[11px] text-muted">Enviando...</span>}
      {erro && <span className="text-xs text-red-400">{erro}</span>}
    </div>
  );
}
