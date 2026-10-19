"use client";

import { useActionState, useState } from "react";
import { semLimpar } from "@/lib/formulario";
import { Assinatura } from "@/components/assinatura";
import { TEXTO_IMAGEM, textoDoTermo } from "@/lib/termo";
import { assinarTermo } from "./actions";

type Props = {
  tatuagemId: string;
  de: string | null;
  tatuagem: string;
  localCorpo: string | null;
  tatuador: string;
  clienteNome: string;
  clienteCpf: string | null;
  menor: boolean;
};

export function TermoForm(props: Props) {
  const [estado, acao, pendente] = useActionState(
    assinarTermo.bind(null, props.tatuagemId, props.de),
    undefined,
  );
  const [nome, setNome] = useState(props.clienteNome);
  const [cpf, setCpf] = useState(props.clienteCpf ?? "");
  const [respNome, setRespNome] = useState("");
  const [respCpf, setRespCpf] = useState("");

  // Mesmo texto que o servidor vai gravar, atualizado conforme o preenchimento.
  const texto = textoDoTermo({
    cliente: nome.trim() || "________",
    cpf: cpf.trim() || null,
    tatuagem: props.tatuagem,
    localCorpo: props.localCorpo,
    tatuador: props.tatuador,
    responsavel: props.menor
      ? { nome: respNome.trim() || "________", cpf: respCpf.trim() || "________" }
      : null,
  });

  return (
    <form {...semLimpar(acao)} className="flex flex-col gap-4">
      <div className="card flex flex-col gap-4">
        <label className="campo">
          Nome completo de quem assina *
          <input name="nome_assinante" required value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className="campo">
          CPF
          <input
            name="cpf_assinante"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
          />
        </label>
        {props.menor && (
          <div className="grid gap-4 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Cliente menor de idade: o responsável legal precisa autorizar e assinar junto.
            </p>
            <label className="campo">
              Nome do responsável *
              <input
                name="responsavel_nome"
                required
                value={respNome}
                onChange={(e) => setRespNome(e.target.value)}
              />
            </label>
            <label className="campo">
              CPF do responsável *
              <input
                name="responsavel_cpf"
                required
                inputMode="numeric"
                value={respCpf}
                onChange={(e) => setRespCpf(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <article className="card max-h-80 overflow-y-auto text-sm leading-relaxed">
        <h2 className="mb-3 font-semibold">Termo de consentimento</h2>
        {texto.split("\n\n").map((p, i) => (
          <p key={i} className="mb-3 last:mb-0">
            {p}
          </p>
        ))}
      </article>

      <div className="card flex flex-col gap-3">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="concordo" className="mt-0.5 size-5 shrink-0 accent-accent" />
          <span className="font-medium">Li e concordo com o termo de consentimento acima.</span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="autoriza_imagem" className="mt-0.5 size-5 shrink-0 accent-accent" />
          <span>
            {TEXTO_IMAGEM} <span className="text-muted">(opcional)</span>
          </span>
        </label>
      </div>

      <div className="card flex flex-col gap-2">
        <p className="text-sm font-medium">
          Assinatura {props.menor ? "do cliente e/ou do responsável" : "do cliente"}
        </p>
        <Assinatura name="assinatura" />
      </div>

      {estado?.erro && <p className="aviso-erro">{estado.erro}</p>}

      <button type="submit" className="botao py-3" disabled={pendente}>
        {pendente ? "Salvando..." : "Confirmar assinatura"}
      </button>
    </form>
  );
}
