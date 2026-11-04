// Dados do Ravenn que aparecem nas páginas públicas (início, termos, privacidade, suporte)
// e na tela de assinatura. Mudou o preço? Muda aqui (e o período grátis também na 0014).

export const RESPONSAVEL = "Tadeu Canavez de Souza";
export const CONTATO = "tadeucanavezzz@gmail.com";

export const PRECO_MENSAL = 15;
export const DIAS_GRATIS = 30;

export const precoMensal = () =>
  PRECO_MENSAL.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

/** Assinatura mensal na App Store (App Store Connect → Assinaturas → ID do produto). */
export const PRODUTO_APPLE = "me.ravenn.app.mensal";
