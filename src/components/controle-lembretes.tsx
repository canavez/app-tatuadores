"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import {
  ativarLembretes,
  desligarLembretes,
  estadoLembretes,
  type EstadoLembretes,
} from "@/lib/lembretes-celular";

const EXPLICACAO = "Um aviso na véspera, às 20h, e outro 1 hora antes de cada sessão.";
const CHAVE_CONVITE = "ravenn:convite-lembretes"; // "dispensado" depois do "Agora não"

function useEstado() {
  const [estado, setEstado] = useState<EstadoLembretes | null>(null);
  useEffect(() => {
    estadoLembretes()
      .then(setEstado)
      .catch(() => setEstado("fora-do-app"));
  }, []);
  return [estado, setEstado] as const;
}

/** Em Conta: liga e desliga os lembretes (só aparece no app do iPhone e do Android). */
export function ControleLembretes() {
  const [estado, setEstado] = useEstado();
  if (!estado || estado === "fora-do-app") return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Lembretes</h2>
      <div className="card flex flex-col gap-3 text-sm">
        <div className="flex items-start gap-3">
          <BellRing className="mt-0.5 size-5 shrink-0 text-lavanda" />
          <div className="min-w-0 flex-1">
            <p>Lembretes das sessões</p>
            <p className="text-xs text-muted">{EXPLICACAO}</p>
          </div>
        </div>
        {estado === "negado" ? (
          <p className="text-xs text-muted">
            {/android/i.test(navigator.userAgent)
              ? "As notificações do Ravenn estão bloqueadas no celular. Para ligar, vá em Configurações → Apps → Ravenn → Notificações."
              : "As notificações do Ravenn estão bloqueadas no iPhone. Para ligar, vá em Ajustes → Ravenn → Notificações."}
          </p>
        ) : estado === "ligado" ? (
          <button
            type="button"
            className="botao-secundario self-start"
            onClick={async () => setEstado(await desligarLembretes())}
          >
            Desligar lembretes
          </button>
        ) : (
          <button
            type="button"
            className="botao self-start"
            onClick={async () => setEstado(await ativarLembretes())}
          >
            Ativar lembretes
          </button>
        )}
      </div>
    </section>
  );
}

/** Na tela Hoje: convite para ativar, uma vez só (só no app do iPhone e do Android). */
export function ConviteLembretes() {
  const [estado, setEstado] = useEstado();
  const [dispensado, setDispensado] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(CHAVE_CONVITE) === "dispensado";
    } catch {
      return false;
    }
  });
  if (estado !== "pedir" || dispensado) return null;

  return (
    <div className="card flex flex-col gap-3 border-accent/40 text-sm">
      <div className="flex items-start gap-3">
        <BellRing className="mt-0.5 size-5 shrink-0 text-lavanda" />
        <div>
          <p className="font-semibold">Receba lembretes das sessões</p>
          <p className="text-muted">{EXPLICACAO}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="botao-secundario py-1.5"
          onClick={() => {
            try {
              localStorage.setItem(CHAVE_CONVITE, "dispensado");
            } catch {}
            setDispensado(true);
          }}
        >
          Agora não
        </button>
        <button
          type="button"
          className="botao py-1.5"
          onClick={async () => setEstado(await ativarLembretes())}
        >
          Ativar
        </button>
      </div>
    </div>
  );
}
