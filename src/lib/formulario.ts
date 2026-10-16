import { startTransition, type FormEvent } from "react";

/**
 * Envia o formulário para a ação sem que o React limpe os campos depois.
 * Com `<form action={...}>` o React 19 apaga tudo o que foi digitado ao terminar,
 * inclusive quando a ação devolve um erro — e aí a pessoa teria que preencher de novo.
 * Uso: `<form onSubmit={semLimpar(acao)}>`.
 */
export function semLimpar(acao: (formData: FormData) => void) {
  return (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const submissor = (evento.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(evento.currentTarget, submissor);
    startTransition(() => acao(formData));
  };
}
