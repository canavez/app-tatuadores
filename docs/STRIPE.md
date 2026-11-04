# Mensalidade pelo Stripe — como ligar

O código já está pronto: botão **Assinar** (página de pagamento do Stripe), **Gerenciar assinatura**
(portal do Stripe para trocar cartão, ver faturas e cancelar) e o endereço `/api/stripe/webhook`,
que avisa o Ravenn quando alguém assina, renova, tem o cartão recusado ou cancela.
O bloqueio continua o mesmo de antes: ele olha a coluna `pago_ate` da tabela `assinaturas`.

Faça tudo primeiro no **modo de teste** do Stripe (chave `sk_test_...`, cartão `4242 4242 4242 4242`).
Só troque para as chaves de produção depois que a verificação de identidade do Stripe for aprovada.

## 1. No seu computador

```
npm install
```
(instala o pacote `stripe`, que entrou no package.json)

## 2. No Supabase

Abra o **SQL Editor** e rode o arquivo `supabase/migrations/0015_stripe.sql`.
Faça isso no projeto principal e também no projeto de testes.

## 3. No Stripe (painel, modo de teste ligado)

1. **Catálogo de produtos → Adicionar produto**: "Ravenn mensal", preço recorrente, **R$ 15,00 por mês**.
   Copie o **ID do preço** (começa com `price_`). Não coloque período grátis no preço: o app já
   manda os dias que faltam do período grátis de cada pessoa.
2. **Configurações → Faturamento → Portal do cliente**: clique em ativar/salvar
   (deixe ligado "cancelar assinatura" e "atualizar forma de pagamento").
3. **Desenvolvedores → Webhooks → Adicionar destino**:
   - Endereço: `https://ravenn.me/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`,
     `customer.subscription.paused`, `customer.subscription.resumed`
   - Copie o **segredo de assinatura** (começa com `whsec_`).

## 4. As chaves (nunca cole em chat nem no código)

Coloque no arquivo `.env.local` (no seu computador) **e** na Vercel
(Projeto → Settings → Environment Variables), depois faça um novo deploy:

```
STRIPE_SECRET_KEY=sk_test_...          # Stripe → Desenvolvedores → Chaves de API
STRIPE_PRICE_ID=price_...              # passo 3.1
STRIPE_WEBHOOK_SECRET=whsec_...        # passo 3.3
SUPABASE_SERVICE_ROLE_KEY=...          # Supabase → Project Settings → API → service_role (secreta)
```

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` não é necessária: o pagamento acontece na página do próprio Stripe.

## 5. Testar no computador (opcional)

Com a [Stripe CLI](https://docs.stripe.com/stripe-cli) instalada:

```
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Ela mostra um `whsec_...` próprio: use esse no `.env.local` enquanto testa localmente.
Mesmo sem a CLI, ao voltar do pagamento a tela de Assinatura já confere no Stripe e libera o acesso.

## Como funciona

- **Durante o período grátis**: a pessoa cadastra o cartão e só é cobrada quando os 30 dias acabarem.
  Se faltarem menos de 2 dias (limite do Stripe), cobra na hora.
- **Pagou**: `pago_ate` vira o fim do mês pago, `origem = 'web'`.
- **Cartão recusado**: não estende. Quando o mês pago acaba, o app bloqueia e a tela de Assinatura
  mostra o aviso e o botão para trocar o cartão.
- **Cancelou**: continua usando até o fim do mês já pago.
- **Excluiu a conta**: a assinatura no Stripe é cancelada antes, para não cobrar mais.
- **App do iPhone**: os botões de assinar/gerenciar não aparecem (regra da Apple, ver abaixo).

## Apple (app do iPhone)

A Apple exige que assinaturas digitais vendidas **dentro** do app usem a compra da App Store
(regra 3.1.1). Por isso, no app os botões de pagamento somem. Pontos de atenção:
- A tela `/assinatura` ainda mostra o preço dentro do app; a revisão da Apple pode reclamar.
- Quem assinou pelo site consegue usar o app normalmente (isso é permitido).
- Quem está no app com o período vencido não tem como assinar por lá. Para o app passar na revisão
  com assinatura obrigatória, o caminho mais seguro é adicionar a compra pela App Store
  (a coluna `origem = 'apple'` já foi prevista para isso).
