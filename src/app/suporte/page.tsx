import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { CONTATO, DIAS_GRATIS } from "@/lib/empresa";
import { PaginaPublica, Secao } from "@/components/pagina-publica";

export const metadata: Metadata = { title: "Suporte · Ravenn" };

const PERGUNTAS: { pergunta: string; resposta: React.ReactNode }[] = [
  {
    pergunta: "Como começo a usar?",
    resposta: (
      <>
        Crie sua conta em{" "}
        <Link href="/login?modo=criar" className="text-lavanda underline">
          ravenn.me
        </Link>{" "}
        com seu e-mail e confirme pelo link que chega na sua caixa de entrada. Você tem {DIAS_GRATIS} dias grátis,
        sem cartão.
      </>
    ),
  },
  {
    pergunta: "Não chegou o e-mail de confirmação.",
    resposta: "Olhe a caixa de spam e a aba Promoções. O e-mail vem de nao-responda@ravenn.me. Se não achar, escreva para nós.",
  },
  {
    pergunta: "Esqueci minha senha.",
    resposta: (
      <>
        Na tela de{" "}
        <Link href="/login" className="text-lavanda underline">
          entrar
        </Link>
        , toque em &quot;Esqueci minha senha&quot; e siga o link que chega por e-mail.
      </>
    ),
  },
  {
    pergunta: "Como cancelo a assinatura?",
    resposta:
      "Pelo site, em Conta → Assinatura → Gerenciar assinatura. Se assinou pelo iPhone, em Ajustes → seu nome → Assinaturas. O acesso continua até o fim do mês já pago.",
  },
  {
    pergunta: "Posso pedir reembolso?",
    resposta: (
      <>
        Sim: em até 7 dias depois da primeira cobrança devolvemos todo o valor. Veja os{" "}
        <Link href="/termos" className="text-lavanda underline">
          termos de uso
        </Link>
        .
      </>
    ),
  },
  {
    pergunta: "Como apago minha conta e meus dados?",
    resposta:
      "No app, em Conta → Excluir minha conta. Tudo é apagado na hora: conta, clientes, anamneses, termos, fotos, agenda, financeiro e estoque.",
  },
  {
    pergunta: "Os lembretes de sessão não aparecem no iPhone.",
    resposta:
      "Os lembretes funcionam no app Ravenn da App Store. Confira em Conta → Lembretes se estão ativados e, nos Ajustes do iPhone → Ravenn → Notificações, se as notificações estão permitidas.",
  },
];

/** Página de suporte (pública): é a "URL de suporte" pedida pela App Store. */
export default function SuportePage() {
  return (
    <PaginaPublica titulo="Suporte">
      <a href={`mailto:${CONTATO}`} className="card flex items-center gap-3 border-accent/40 text-foreground">
        <Mail className="size-5 shrink-0 text-lavanda" />
        <span className="min-w-0">
          <span className="block font-semibold">Fale com a gente</span>
          <span className="block break-all text-muted">{CONTATO}</span>
        </span>
      </a>
      <p>Respondemos em até 2 dias úteis.</p>

      <Secao titulo="Perguntas frequentes">
        <div className="flex flex-col gap-2">
          {PERGUNTAS.map(({ pergunta, resposta }) => (
            <details key={pergunta} className="card group py-3">
              <summary className="cursor-pointer list-none font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {pergunta}
              </summary>
              <p className="mt-2">{resposta}</p>
            </details>
          ))}
        </div>
      </Secao>
    </PaginaPublica>
  );
}
