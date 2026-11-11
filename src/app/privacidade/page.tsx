import type { Metadata } from "next";
import { CONTATO, RESPONSAVEL } from "@/lib/empresa";
import { PaginaPublica, Secao } from "@/components/pagina-publica";

export const metadata: Metadata = { title: "Política de privacidade · Ravenn" };

const ATUALIZADA_EM = "7 de novembro de 2026";

/** Página pública (sem login): a App Store e a Play Store pedem o link dela. */
export default function PrivacidadePage() {
  return (
    <PaginaPublica
      titulo="Política de privacidade"
      atualizadaEm={ATUALIZADA_EM}
    >
      <p>
        O Ravenn é um aplicativo para tatuadores organizarem clientes, agenda,
        financeiro e estoque. Esta política explica quais dados o Ravenn guarda,
        para quê, com quem eles são compartilhados e como você pode exercer seus
        direitos, de acordo com a Lei Geral de Proteção de Dados (Lei
        13.709/2018, LGPD).
      </p>

      <Secao titulo="Quem é responsável">
        <p>
          O Ravenn é mantido por {RESPONSAVEL}. Para qualquer assunto sobre
          privacidade, escreva para{" "}
          <span className="text-foreground">{CONTATO}</span>.
        </p>
        <p>
          Os dados da sua conta (nome, e-mail, senha e foto) são tratados pelo
          Ravenn como controlador. Os dados dos seus clientes são cadastrados e
          decididos por você, tatuador: nesse caso você é o controlador e o
          Ravenn apenas guarda e organiza esses dados por sua conta (operador),
          sem usá-los para nenhum outro fim.
        </p>
      </Secao>

      <Secao titulo="Quais dados guardamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="text-foreground">Sua conta:</span> nome, e-mail,
            senha (guardada de forma criptografada, nunca em texto) e foto de
            perfil, se você enviar.
          </li>
          <li>
            <span className="text-foreground">Seus clientes:</span> nome,
            telefone, e-mail, Instagram, CPF, data de nascimento, observações e
            foto, conforme você preencher.
          </li>
          <li>
            <span className="text-foreground">Ficha de saúde (anamnese):</span>{" "}
            condições de saúde, alergias e medicamentos do cliente. São dados
            pessoais sensíveis e só são registrados para a segurança do
            procedimento.
          </li>
          <li>
            <span className="text-foreground">Termos de consentimento:</span>{" "}
            texto aceito, nome, CPF e assinatura do cliente (e do responsável,
            quando menor de idade).
          </li>
          <li>
            <span className="text-foreground">Pedidos de orçamento:</span>{" "}
            quem pede um orçamento pela página pública de um tatuador
            (ravenn.me/link-do-tatuador) informa nome, celular, a ideia da
            tatuagem, o lugar do corpo e, se quiser, imagens de referência.
            Esses dados vão só para aquele tatuador, para responder o pedido, e
            ele pode apagá-los quando quiser.
          </li>
          <li>
            <span className="text-foreground">Trabalho:</span> tatuagens,
            sessões, valores, pagamentos, taxas, despesas e estoque.
          </li>
        </ul>
        <p>
          Não usamos cookies de propaganda nem de rastreamento. Os únicos
          cookies são os necessários para manter você conectado.
        </p>
      </Secao>

      <Secao titulo="Para que usamos">
        <p>
          Só para o funcionamento do aplicativo: mostrar e organizar sua agenda,
          seus clientes, suas finanças e seu estoque, gerar relatórios para você
          e permitir o login. Não vendemos, não alugamos e não usamos seus dados
          nem os dos seus clientes para publicidade.
        </p>
        <p>
          As bases legais são a execução do contrato com você (LGPD, art. 7º, V)
          e, para a ficha de saúde e os termos, a proteção da vida e da saúde do
          cliente e o consentimento dele, colhido por você (art. 11). Cabe a
          você, tatuador, informar seus clientes de que os dados deles ficam
          registrados no Ravenn.
        </p>
      </Secao>

      <Secao titulo="Com quem compartilhamos">
        <p>
          Apenas com os fornecedores que fazem o aplicativo funcionar, sob
          contrato e só para isso:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="text-foreground">Supabase</span> — banco de dados,
            login e armazenamento das fotos.
          </li>
          <li>
            <span className="text-foreground">Vercel</span> — hospedagem do
            aplicativo.
          </li>
          <li>
            <span className="text-foreground">Resend</span> — envio dos e-mails
            de cadastro e de troca de senha.
          </li>
          <li>
            <span className="text-foreground">Stripe</span> — pagamento da
            assinatura feita pelo site. Os dados do cartão vão direto para o
            Stripe; o Ravenn nunca os vê nem guarda.
          </li>
          <li>
            <span className="text-foreground">Apple</span> — pagamento da
            assinatura feita pelo iPhone, quando houver.
          </li>
          <li>
            <span className="text-foreground">Google</span> — pagamento da
            assinatura feita pelo app de Android (Google Play), quando houver.
          </li>
        </ul>
        <p>
          Esses serviços podem guardar os dados em servidores fora do Brasil,
          com as garantias de segurança previstas na LGPD. Também podemos
          fornecer dados se uma lei ou ordem judicial exigir.
        </p>
      </Secao>

      <Secao titulo="Segurança">
        <p>
          Toda a comunicação é criptografada (HTTPS). Cada conta só enxerga os
          próprios dados, com regras de acesso aplicadas no próprio banco de
          dados, e as fotos ficam num espaço privado, acessível só por links
          temporários.
        </p>
      </Secao>

      <Secao titulo="Por quanto tempo guardamos">
        <p>
          Enquanto sua conta existir. Você pode apagar clientes e registros a
          qualquer momento. Ao excluir a conta, tudo é apagado na hora: conta,
          clientes, anamneses, termos, fotos, agenda, financeiro e estoque.
        </p>
      </Secao>

      <Secao titulo="Seus direitos">
        <p>
          Você pode, a qualquer momento: confirmar quais dados temos,
          acessá-los, corrigi-los, levá-los para outro serviço, pedir a exclusão
          e revogar consentimentos (LGPD, art. 18). A maior parte disso você faz
          direto no aplicativo; para o resto, escreva para {CONTATO}.
        </p>
        <p>
          Para excluir sua conta e todos os dados: no aplicativo, vá em{" "}
          <span className="text-foreground">Conta → Excluir minha conta</span>.
          Seus clientes que quiserem exercer esses direitos devem falar com
          você, que é quem decide sobre os dados deles; ajudamos no que for
          preciso.
        </p>
      </Secao>

      <Secao titulo="Menores de idade">
        <p>
          O Ravenn é para tatuadores maiores de 18 anos. Dados de clientes
          menores de idade só devem ser registrados com a autorização do
          responsável legal, colhida pelo tatuador.
        </p>
      </Secao>

      <Secao titulo="Mudanças nesta política">
        <p>
          Se esta política mudar, a data no topo é atualizada e, se a mudança
          for importante, avisamos no aplicativo.
        </p>
      </Secao>
    </PaginaPublica>
  );
}
