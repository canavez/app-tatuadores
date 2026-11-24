import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BellRing, CalendarDays, Check, FileSignature, Package, Wallet, type LucideIcon } from "lucide-react";
import { RodapePublico } from "@/components/rodape-publico";
import { DIAS_GRATIS, precoMensal } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Ravenn · Agenda, clientes e financeiro para tatuadores",
  description:
    "Organize agenda, clientes, anamnese, termo de consentimento, financeiro e estoque do seu estúdio de tatuagem num app só.",
};

const RECURSOS: { Icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    Icone: CalendarDays,
    titulo: "Agenda que não deixa marcar por cima",
    texto: "Linha do tempo do dia com os horários livres, várias sessões por tatuagem e lembrete pelo WhatsApp.",
  },
  {
    Icone: FileSignature,
    titulo: "Anamnese e termo no celular",
    texto: "Ficha de saúde do cliente e termo de consentimento assinado na tela. Sem papel, sem pasta.",
  },
  {
    Icone: Wallet,
    titulo: "Financeiro de verdade",
    texto: "Sinal, pagamentos, taxa da maquininha, comissão do estúdio e despesas. Relatório do mês em PDF.",
  },
  {
    Icone: Package,
    titulo: "Estoque que avisa",
    texto: "Cartuchos, agulhas e tintas com aviso quando estão acabando — e baixa automática a cada sessão.",
  },
  {
    Icone: BellRing,
    titulo: "Lembretes no celular",
    texto: "Aviso na véspera e 1 hora antes de cada sessão, com o que ainda falta (sinal, anamnese, termo).",
  },
];

/** Página inicial pública (quem já está logado vai direto para o app — ver proxy). */
export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-14 px-4 pb-16 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between">
        <Image src="/logo.png" alt="Ravenn" width={640} height={203} className="h-8 w-auto" priority />
        <Link href="/login" className="botao-secundario py-1.5">
          Entrar
        </Link>
      </header>

      <section className="flex flex-col gap-5">
        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          O estúdio inteiro
          <br />
          <span className="text-lavanda">no seu bolso.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Agenda, clientes, anamnese, termo assinado, financeiro e estoque — feito para tatuador, do jeito que o
          tatuador trabalha.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/login?modo=criar" className="botao px-5 py-3 text-base">
            Começar grátis
          </Link>
          <span className="text-sm text-muted">{DIAS_GRATIS} dias grátis, sem cartão.</span>
        </div>
      </section>

      <section aria-labelledby="recursos" className="flex flex-col gap-4">
        <h2 id="recursos" className="text-xs font-medium uppercase tracking-wide text-muted">
          O que tem no Ravenn
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {RECURSOS.map(({ Icone, titulo, texto }) => (
            <li key={titulo} className="card flex flex-col gap-2">
              <Icone className="size-6 text-lavanda" />
              <p className="font-semibold">{titulo}</p>
              <p className="text-sm text-muted">{texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="preco" className="flex flex-col gap-4">
        <h2 id="preco" className="text-xs font-medium uppercase tracking-wide text-muted">
          Preço
        </h2>
        <div className="card flex flex-col gap-4 border-accent/40">
          <div>
            <p className="text-lg font-semibold">Ravenn mensal</p>
            <p className="mt-1">
              <span className="text-4xl font-bold">{precoMensal()}</span>
              <span className="text-muted"> por mês</span>
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {[
              `${DIAS_GRATIS} dias grátis para testar tudo, sem cartão`,
              "Todos os recursos, sem limite de clientes",
              "Cancele quando quiser, sem multa",
              "Seus dados são seus: exporte ou apague a qualquer momento",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-lavanda" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/login?modo=criar" className="botao self-start px-5 py-3 text-base">
            Começar grátis
          </Link>
        </div>
      </section>

      <RodapePublico />
    </main>
  );
}
