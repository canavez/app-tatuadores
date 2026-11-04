# Mensalidade pelo app do iPhone (compra da App Store) — como ligar

O código já está pronto: na tela **Assinatura**, dentro do app do iPhone, aparecem **Assinar por R$ X/mês**
(a janela de pagamento da própria Apple), **Restaurar compras** e, para quem já assinou, **Gerenciar
assinatura** (abre a tela de assinaturas da App Store). No site nada muda: continua o Stripe.

Quando alguém paga pelo iPhone, o app manda a compra para `/api/apple/compra`, o servidor confere com a
Apple e libera o acesso na hora (`pago_ate`, `origem = 'apple'`). Renovações, cancelamentos, cobranças
recusadas e reembolsos chegam depois pelo endereço `/api/apple/notificacoes`.

## 1. Contrato de apps pagos (App Store Connect)

Sem isso a Apple não deixa vender nada.

1. Entre em https://appstoreconnect.apple.com → **Negócios** (Business).
2. Em **Apps pagos** (Paid Apps), clique em **Ver e concordar com os termos**.
3. Preencha **Informações bancárias** (conta para receber), **Impostos** (formulário W-8BEN, por ser
   pessoa de fora dos EUA) e **Contato**. Fica "Ativo" depois que a Apple confere (pode levar 1 a 2 dias).
4. Recomendado: inscreva-se no **App Store Small Business Program** (a Apple fica com 15% em vez de 30%):
   https://developer.apple.com/app-store/small-business-program/

## 2. Criar a assinatura (App Store Connect)

1. **Apps → Ravenn → Monetização → Assinaturas**.
2. **Grupos de assinaturas → +**: nome `Ravenn`.
3. Dentro do grupo, **Criar assinatura**:
   - Nome de referência: `Ravenn mensal`
   - **ID do produto: `me.ravenn.app.mensal`** (exatamente assim; está no código)
4. Na assinatura criada:
   - **Duração**: 1 mês.
   - **Preço da assinatura → +**: país Brasil, escolha **R$ 14,90** (a Apple não tem R$ 15,00 redondo;
     ela ajusta os outros países sozinha).
   - **Disponibilidade**: todos os países, ou só Brasil.
   - **Localização da App Store → Português (Brasil)**: nome exibido `Ravenn mensal`, descrição
     `Agenda, clientes, financeiro e estoque, sem limites.`
   - **Informações para revisão**: uma captura da tela Assinatura do app e a nota
     `Assinatura mensal que libera o uso do app depois do período grátis de 30 dias.`
5. **Oferta introdutória** (opcional, recomendado): **Ofertas de assinatura → Oferta introdutória → +**,
   Brasil, **Grátis**, duração **1 mês**. Assim quem assina pelo iPhone também começa com um mês grátis
   (a Apple só dá uma vez por ID Apple). Sem ela, a Apple cobra no dia em que a pessoa assinar.
6. Na página do app (**Distribuição → versão do app**), na seção **Compras dentro do app e assinaturas**,
   adicione `Ravenn mensal` para ela ir junto na próxima revisão. A primeira assinatura de um app
   precisa ser enviada junto com uma versão nova do app.

## 3. Avisos da Apple para o Ravenn (App Store Connect)

1. **Apps → Ravenn → Informações do app** (App Information), desça até
   **Notificações do servidor da App Store**.
2. **URL do servidor de produção**: `https://ravenn.me/api/apple/notificacoes` → versão **2**.
3. **URL do servidor do Sandbox**: o mesmo endereço → versão **2**.
4. Na mesma página, em cima, copie o **Apple ID** do app (um número, ex.: `6740000000`). Ele vai no passo 5.

## 4. Supabase

Abra o **SQL Editor** e rode o arquivo `supabase/migrations/0016_apple.sql`
(no projeto principal e no de testes).

## 5. Vercel

Projeto → **Settings → Environment Variables**, adicione e depois faça um novo deploy:

```
APPLE_APP_ID=6740000000     # o número do passo 3.4
```

Não precisa de chave secreta da Apple: o servidor só confere as assinaturas digitais das compras.

## 6. Versão nova do app (Codemagic → TestFlight)

O plugin de compra é parte nativa, então precisa de um build novo: Codemagic → **Start new build**
(workflow "iPhone → TestFlight"). Quem está com a versão antiga do app vê "Atualize o app Ravenn".

## 7. Testar sem pagar de verdade

Compras feitas no TestFlight são de teste (Sandbox): a Apple não cobra e as renovações são aceleradas
(1 mês vira ~5 minutos, até 12 renovações).

1. No iPhone, abra o Ravenn instalado pelo TestFlight, entre numa conta de teste e vá em **Conta → Assinatura**.
2. Toque em **Assinar**, confirme na janela da Apple (diz "Sandbox").
3. A tela deve mostrar **Assinatura ativa até ...** em poucos segundos.
4. No Supabase, a linha da conta em `assinaturas` deve ter `origem = apple` e `apple_ambiente = Sandbox`.
5. Para testar o cancelamento: Ajustes → App Store → Conta Sandbox → Gerenciar → cancelar.

## Como funciona

- **Assinou pelo iPhone**: `pago_ate` = fim do mês pago (ou do mês grátis da oferta), `origem = 'apple'`.
- **Renovou**: a Apple avisa e `pago_ate` avança.
- **Cobrança recusada**: a tela mostra o aviso; se a Apple der carência, o acesso continua durante ela.
- **Cancelou** (desligou a renovação): usa até o fim do mês já pago.
- **Reembolso pela Apple**: o acesso acaba na data do reembolso.
- **Mesma conta Apple em duas contas do Ravenn**: a assinatura fica ligada à conta em que foi comprada.
- **Excluir a conta**: o Ravenn não consegue cancelar a assinatura da Apple; a tela de exclusão avisa
  a pessoa para cancelar em Ajustes → seu nome → Assinaturas.
- **Compras de teste** (TestFlight e equipe de revisão da Apple) também liberam acesso. Para recusar
  as de teste no futuro: `APPLE_SO_PRODUCAO=1` na Vercel.
