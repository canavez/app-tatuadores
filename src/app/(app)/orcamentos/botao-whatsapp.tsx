"use client";

import { MessageCircle } from "lucide-react";
import { marcarRespondido } from "./actions";

/** Abre o WhatsApp do cliente com a mensagem pronta e tira o orçamento dos novos. */
export function BotaoWhatsApp({
  id,
  href,
  grande = false,
}: {
  id: string;
  href: string;
  grande?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => void marcarRespondido(id)}
      className={
        grande
          ? "inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-base font-semibold text-black transition hover:opacity-90"
          : "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-1.5 text-sm font-semibold text-black transition hover:opacity-90"
      }
    >
      <MessageCircle className={grande ? "size-5" : "size-4"} />
      {grande ? "Responder no WhatsApp" : "WhatsApp"}
    </a>
  );
}
