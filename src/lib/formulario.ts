import { startTransition, type FormEvent } from "react";

/**
 * Props para um <form> que envia para uma ação sem o React limpar os campos depois.
 * - Com JavaScript: o onSubmit cancela o envio padrão e chama a ação; assim o React 19
 *   não apaga o que foi digitado quando a ação devolve um erro.
 * - Sem JavaScript (página ainda carregando ou navegador antigo): o `action` faz o
 *   navegador mandar o formulário direto para o servidor, e funciona do mesmo jeito.
 * Uso: `<form {...semLimpar(acao)}>`.
 */
export function semLimpar(acao: (formData: FormData) => void) {
  return {
    action: acao,
    onSubmit: (evento: FormEvent<HTMLFormElement>) => {
      evento.preventDefault();
      const submissor = (evento.nativeEvent as SubmitEvent).submitter;
      const formData = new FormData(evento.currentTarget, submissor);
      startTransition(() => acao(formData));
    },
  };
}
