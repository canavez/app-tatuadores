"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { lembretesDasProximasSessoes } from "@/app/(app)/lembretes-actions";
import {
  EVENTO_REAGENDAR,
  aoTocarNotificacao,
  estadoLembretes,
  reagendar,
} from "@/lib/lembretes-celular";

/**
 * No app do iPhone, mantém os lembretes das sessões agendados no aparelho: ao abrir,
 * ao voltar para o app e a cada troca de tela (sessões podem ter sido criadas ou mudadas).
 * No site comum não faz nada.
 */
export function LembretesNoCelular() {
  const router = useRouter();
  const caminho = usePathname();

  useEffect(() => {
    let desligar = () => {};
    aoTocarNotificacao((url) => router.push(url)).then((d) => (desligar = d));
    return () => desligar();
  }, [router]);

  useEffect(() => {
    let cancelado = false;
    async function atualizar() {
      try {
        if ((await estadoLembretes()) !== "ligado") return;
        const lembretes = await lembretesDasProximasSessoes();
        if (!cancelado) await reagendar(lembretes);
      } catch {
        // Sem internet ou plugin indisponível: fica com os lembretes que já estavam.
      }
    }
    // Espera um pouco: várias trocas de tela seguidas viram um agendamento só.
    const espera = setTimeout(atualizar, 1500);
    const aoVoltar = () => document.visibilityState === "visible" && atualizar();
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener(EVENTO_REAGENDAR, atualizar);
    return () => {
      cancelado = true;
      clearTimeout(espera);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener(EVENTO_REAGENDAR, atualizar);
    };
  }, [caminho]);

  return null;
}
