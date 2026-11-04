import Link from "next/link";
import { Check } from "lucide-react";
import { Topo } from "@/components/topo";
import { buscarAssinatura, buscarStripe } from "@/lib/assinatura";
import { createClient } from "@/lib/supabase/server";
import { SITUACOES_VIVAS, sincronizarAssinatura, stripe } from "@/lib/stripe";
import { BotaoAssinar, BotaoGerenciar, BotaoGerenciarApple, Preco } from "./botoes";
import { partesLocais } from "@/lib/agenda";
import { formatarData } from "@/lib/clientes";
import { precoMensal } from "@/lib/empresa";

const INCLUI = [
  "Agenda com linha do tempo e lembretes no iPhone",
  "Clientes com anamnese, termo assinado e fotos",
  "Financeiro com taxas, comissão e relatórios em PDF",
  "Estoque com aviso de itens acabando",
];

const data = (instante: string) => formatarData(partesLocais(instante).data);

/**
 * Voltou do pagamento: confere no Stripe e já libera o acesso (sem esperar o webhook).
 * Só vale para uma sessão de pagamento do próprio tatuador logado.
 */
async function confirmarPagamento(sessaoId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const sessao = await stripe().checkout.sessions.retrieve(sessaoId);
    if (!user || sessao.client_reference_id !== user.id || !sessao.subscription) return false;
    await sincronizarAssinatura(
      typeof sessao.subscription === "string" ? sessao.subscription : sessao.subscription.id,
    );
    return true;
  } catch {
    // O webhook do Stripe libera logo em seguida de qualquer jeito.
    return false;
  }
}

export default async function AssinaturaPage({ searchParams }: PageProps<"/assinatura">) {
  const { sessao } = await searchParams;
  const pagou = typeof sessao === "string" && sessao.startsWith("cs_") && (await confirmarPagamento(sessao));
  const assinatura = await buscarAssinatura();
  const doStripe = await buscarStripe();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: apple } = await supabase
    .from("assinaturas")
    .select("apple_transacao_original, apple_status")
    .maybeSingle();
  // Assinou pela Apple e a assinatura ainda pode renovar: gerencia na Apple, não assina de novo.
  const appleViva = Boolean(apple?.apple_transacao_original) &&
    ["ativa", "cancelada", "cobranca_falhou"].includes(apple?.apple_status ?? "");
  // Já existe uma assinatura no Stripe (mesmo com cartão recusado): gerencia, não assina de novo.
  const assinaturaViva = doStripe.temAssinatura && SITUACOES_VIVAS.includes(doStripe.status ?? "");

  return (
    <>
      <Topo titulo="Assinatura" voltar={assinatura?.situacao === "vencida" ? undefined : "/conta"} />
      <div className="flex flex-col gap-4">
        {pagou && <p className="aviso-ok">Assinatura confirmada. Obrigado por assinar o Ravenn!</p>}
        {doStripe.status === "past_due" || doStripe.status === "unpaid" ? (
          <p className="aviso-erro">
            Não conseguimos cobrar a mensalidade no seu cartão. Troque o cartão em &quot;Gerenciar
            assinatura&quot; para continuar usando.
          </p>
        ) : null}
        {assinatura?.situacao === "vencida" && (
          <div className="card flex flex-col gap-1 border-amber-500/40">
            <p className="font-semibold">Seu período grátis terminou</p>
            <p className="text-sm text-muted">
              Seus dados continuam guardados. Assine para voltar a usar a agenda, os clientes e o financeiro.
            </p>
          </div>
        )}
        {assinatura?.situacao === "teste" && (
          <p className="aviso-ok">
            Período grátis: {assinatura.dias === 1 ? "falta 1 dia" : `faltam ${assinatura.dias} dias`} (até{" "}
            {data(assinatura.ate)}).
          </p>
        )}
        {assinatura?.situacao === "ativa" && (
          <p className="aviso-ok">Assinatura ativa até {data(assinatura.ate)}.</p>
        )}

        <div className="card flex flex-col gap-4">
          <div>
            <p className="text-lg font-semibold">Ravenn mensal</p>
            <p className="mt-1">
              <Preco doSite={precoMensal()} />
              <span className="text-muted"> por mês</span>
            </p>
            <p className="text-sm text-muted">Tudo do app, sem limite de clientes. Cancele quando quiser.</p>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {INCLUI.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-lavanda" />
                {item}
              </li>
            ))}
          </ul>
          {assinatura?.situacao !== "ativa" && !assinaturaViva && !appleViva && user && (
            <BotaoAssinar
              tatuadorId={user.id}
              gratisAte={assinatura?.situacao === "teste" ? data(assinatura.ate) : undefined}
            />
          )}
        </div>

        {apple?.apple_status === "cobranca_falhou" && (
          <p className="aviso-erro">
            A Apple não conseguiu cobrar a mensalidade. Confira a forma de pagamento em Ajustes → seu nome →
            Assinaturas.
          </p>
        )}
        {doStripe.temAssinatura && <BotaoGerenciar />}
        {apple?.apple_transacao_original && <BotaoGerenciarApple />}

        {assinatura?.situacao === "vencida" && (
          <div className="card flex flex-col gap-2 text-sm">
            <p className="font-semibold">Seus dados são seus</p>
            <p className="text-muted">Mesmo sem assinar, você pode:</p>
            <Link href="/financeiro/relatorio" className="text-lavanda underline">
              Baixar o relatório financeiro
            </Link>
            <Link href="/conta" className="text-lavanda underline">
              Ver sua conta
            </Link>
            <Link href="/conta/excluir" className="text-lavanda underline">
              Excluir sua conta e todos os dados
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
