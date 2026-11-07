"use client";

import { useActionState, useState } from "react";
import { semLimpar } from "@/lib/formulario";
import { limparSlug } from "@/lib/orcamentos";
import { salvarPagina } from "./actions";

type Props = { slug: string; nome: string; bio: string; aceitando: boolean; existe: boolean };

export function PaginaForm({ slug, nome, bio, aceitando, existe }: Props) {
  const [estado, acao, pendente] = useActionState(salvarPagina, undefined);
  const [link, setLink] = useState(slug);

  return (
    <form {...semLimpar(acao)} className="card flex flex-col gap-4">
      <label className="campo">
        Seu link
        <span className="flex items-center rounded-xl border border-border bg-background focus-within:border-accent">
          <span className="pl-3 text-base font-normal text-muted">ravenn.me/</span>
          <input
            name="slug"
            required
            value={link}
            onChange={(e) => setLink(limparSlug(e.target.value))}
            minLength={3}
            maxLength={30}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="seunome"
            className="min-w-0 flex-1 border-0! pl-0.5!"
          />
        </span>
      </label>
      <p className="-mt-2 text-xs text-muted">Letras, números, ponto, hífen ou sublinhado. Ex.: o seu @ do Instagram.</p>

      <label className="campo">
        Nome na página
        <input name="nome" required maxLength={120} defaultValue={nome} placeholder="Ex.: Ana Ravenn Tattoo" />
      </label>

      <label className="campo">
        <span>
          Apresentação <span className="font-normal text-muted">(opcional)</span>
        </span>
        <textarea
          name="bio"
          rows={3}
          maxLength={500}
          defaultValue={bio}
          placeholder="Ex.: Fineline e blackwork · Estúdio em Pinheiros, São Paulo"
        />
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="aceitando" defaultChecked={aceitando} className="size-5 accent-[var(--accent)]" />
        Receber pedidos de orçamento
      </label>

      <p className="text-xs text-muted">A foto da página é a mesma da sua Conta.</p>

      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}
      {estado?.mensagem && <p className="aviso-ok">{estado.mensagem}</p>}
      <button type="submit" className="botao self-end" disabled={pendente}>
        {pendente ? "Salvando..." : existe ? "Salvar" : "Criar minha página"}
      </button>
    </form>
  );
}
