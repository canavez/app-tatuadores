import type { Metadata } from "next";
import Link from "next/link";
import { CONTATO, DIAS_GRATIS, RESPONSAVEL, precoMensal } from "@/lib/empresa";
import { PaginaPublica, Secao } from "@/components/pagina-publica";

export const metadata: Metadata = { title: "Termos de uso · Ravenn" };

const ATUALIZADOS_EM = "4 de novembro de 2026";

/** Termos de uso (públicos): o Stripe e as lojas de apps conferem esta página. */
export default function TermosPage() {
  return (
    <PaginaPublica titulo="Termos de uso" atualizadaEm={ATUALIZADOS_EM}>
      <p>
        Estes termos valem para quem usa o Ravenn, aplicativo para tatuadores organizarem agenda, clientes,
        financeiro e estoque, mantido por {RESPONSAVEL}. Ao criar uma conta, você concorda com eles e com a{" "}
        <Link href="/privacidade" className="text-lavanda underline">
          política de privacidade
        </Link>
        .
      </p>

      <Secao titulo="1. A conta">
        <p>
          Para usar o Ravenn você precisa ter 18 anos ou mais e criar uma conta com e-mail e senha. A conta é
          pessoal: guarde sua senha e não a compartilhe. Você é responsável pelo que for feito com ela.
        </p>
      </Secao>

      <Secao titulo="2. Período grátis">
        <p>
          Toda conta nova tem {DIAS_GRATIS} dias grátis, com todos os recursos e sem pedir cartão. Ao final, para
          continuar usando, é preciso assinar. Nada é cobrado automaticamente ao fim do período grátis.
        </p>
      </Secao>

      <Secao titulo="3. Assinatura e pagamento">
        <p>
          A assinatura custa {precoMensal()} por mês e se renova automaticamente a cada mês, até você cancelar. O
          preço inclui todos os recursos, sem limite de clientes.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="text-foreground">Pelo site:</span> o pagamento é feito no cartão de crédito, processado
            pelo Stripe. O Ravenn não vê nem guarda os dados do cartão.
          </li>
          <li>
            <span className="text-foreground">Pelo iPhone:</span> quando disponível, a assinatura feita pelo app é
            cobrada pela Apple, na sua conta Apple, e segue também as regras da App Store.
          </li>
        </ul>
        <p>
          Se uma cobrança não for aprovada, tentamos de novo por alguns dias. Sem pagamento, a assinatura vence e o
          acesso aos recursos é suspenso — seus dados continuam guardados (veja o item 6).
        </p>
        <p>
          Se o preço mudar, avisamos com pelo menos 30 dias de antecedência, e o novo valor só vale a partir da
          renovação seguinte ao aviso.
        </p>
      </Secao>

      <Secao titulo="4. Cancelamento">
        <p>
          Você pode cancelar quando quiser, sem multa: pelo site, em Conta → Assinatura → Gerenciar assinatura; pelo
          iPhone, nos Ajustes do iPhone → seu nome → Assinaturas. O acesso continua até o fim do mês já pago e não
          há nova cobrança.
        </p>
      </Secao>

      <Secao titulo="5. Reembolso e arrependimento">
        <p>
          Pelo Código de Defesa do Consumidor (art. 49), você pode desistir da assinatura em até 7 dias depois da
          primeira cobrança e recebe todo o valor de volta. Basta escrever para{" "}
          <span className="text-foreground">{CONTATO}</span>.
        </p>
        <p>
          Depois desse prazo, os meses já pagos não são devolvidos, nem em parte, mas você pode cancelar para não
          haver as próximas cobranças. Assinaturas feitas pelo iPhone são reembolsadas pela própria Apple, em
          reportaproblem.apple.com.
        </p>
      </Secao>

      <Secao titulo="6. Seus dados">
        <p>
          Os dados que você cadastra (clientes, anamneses, termos, agenda, financeiro, estoque) são seus. Mesmo com a
          assinatura vencida, você continua podendo entrar, baixar o relatório financeiro e excluir a conta. Ao
          excluir a conta, tudo é apagado na hora e de forma definitiva.
        </p>
        <p>
          Você é responsável pelos dados dos seus clientes que cadastrar: por informar a eles que os dados ficam
          registrados no Ravenn e por colher o consentimento quando necessário, como na anamnese e no termo.
        </p>
      </Secao>

      <Secao titulo="7. Uso permitido">
        <p>
          O Ravenn é para organizar o trabalho de tatuagem. Não é permitido usá-lo para atividades ilegais, para
          guardar dados de pessoas sem base legal, nem tentar acessar contas de outras pessoas ou atrapalhar o
          funcionamento do serviço. Nesses casos, a conta pode ser suspensa.
        </p>
      </Secao>

      <Secao titulo="8. Disponibilidade e responsabilidade">
        <p>
          Trabalhamos para o Ravenn ficar no ar o tempo todo e para seus dados ficarem seguros, mas o serviço pode
          ter interrupções para manutenção ou por falhas de fornecedores. O termo de consentimento e a anamnese
          ajudam a organizar o atendimento, mas não substituem os cuidados e as obrigações legais do tatuador.
        </p>
      </Secao>

      <Secao titulo="9. Mudanças nestes termos">
        <p>
          Se estes termos mudarem, a data no topo é atualizada e, se a mudança for importante, avisamos no
          aplicativo ou por e-mail antes de ela valer.
        </p>
      </Secao>

      <Secao titulo="10. Contato e foro">
        <p>
          Dúvidas, cancelamentos e pedidos de reembolso: <span className="text-foreground">{CONTATO}</span>. Estes
          termos seguem as leis do Brasil, e vale o foro do seu domicílio, como prevê o Código de Defesa do
          Consumidor.
        </p>
      </Secao>
    </PaginaPublica>
  );
}
