# App de Android (Google Play) — como ligar

O app de Android é a mesma "casca" do iPhone (Capacitor) abrindo `https://ravenn.me/hoje`. O projeto está
na pasta `android/`, com o ícone e a abertura do Ravenn, lembretes das sessões (notificações no aparelho)
e a assinatura pela compra do Google Play. O Codemagic gera o `.aab` e manda para a Play Store
(workflow "Android → Google Play" no `codemagic.yaml`).

O que muda no Android em relação ao site:

- **Assinatura**: dentro do app a compra é pelo Google Play (o Google exige, como a Apple). Na tela
  **Assinatura** aparecem **Assinar por R$ X/mês**, **Restaurar compras** e, para quem já assinou,
  **Gerenciar assinatura** (abre as assinaturas da Play Store). O app manda a compra para
  `/api/google/compra`, o servidor confere com o Google e libera o acesso na hora (`origem = 'google'`).
  Renovações, cancelamentos e reembolsos chegam por `/api/google/notificacoes`.
- **Imprimir / salvar PDF** (termo e relatório): abre a tela de impressão do Android, que tem "Salvar como PDF".
- **Salvar imagem** do relatório e **compartilhar** o link da página: abrem o "Compartilhar" do Android.
- **Lembretes**: aviso na véspera e 1 hora antes, como no iPhone (podem sair com alguns minutos de folga,
  porque o app não usa "alarme exato", que a Play Store restringe a apps de despertador).

## 1. Conta de desenvolvedor Google Play (Tadeu)

1. Entre em https://play.google.com/console/signup com a conta Google que vai ser dona do app.
2. Escolha **Pessoal** (você) ou **Organização** (precisa de CNPJ e número D-U-N-S).
3. Pague a taxa única de **US$ 25** e faça a **verificação de identidade** (documento com foto; pode
   levar alguns dias). O Google também pede para confirmar um celular Android com o app Play Console.
4. **Conta pessoal criada depois de nov/2023**: antes de publicar para todo mundo, o Google exige um
   **teste fechado com pelo menos 12 testadores por 14 dias seguidos**. Comece isso cedo (passo 8).
   Conta de organização não tem essa exigência.

## 2. Criar o app no Play Console

1. **Criar app**: nome `Ravenn`, idioma Português (Brasil), **App**, **Gratuito** (a assinatura é dentro do app).
2. Em **Configurar o app**, preencha:
   - **Política de privacidade**: `https://ravenn.me/privacidade`
   - **Acesso ao app**: tudo exige login → informe a conta de teste e a senha para a revisão do Google.
   - **Anúncios**: não tem.
   - **Classificação do conteúdo**: questionário (app de produtividade/negócios, sem conteúdo sensível).
   - **Público-alvo**: 18 anos ou mais.
   - **Segurança dos dados**: coleta nome, e-mail, telefone e fotos dos clientes do tatuador; dados de
     saúde (anamnese); tudo criptografado em trânsito; o usuário pode pedir exclusão.
   - **Exclusão de conta**: `https://ravenn.me/conta/excluir` (e o e-mail de suporte).
   - **Categoria**: Empresa (ou Produtividade). Contato: e-mail de suporte e site `https://ravenn.me/suporte`.
3. **Listagem da loja**: descrição curta e completa, ícone 512×512 (`public/icone-512.png`), imagem de
   destaque 1024×500 e pelo menos 2 capturas de tela de celular.

## 3. Primeira versão (.aab) — enviada à mão uma vez

O Google só aceita envio automático (Codemagic) depois que a primeira versão foi enviada à mão.

1. No Codemagic, adicione a **chave de envio**: Team settings → **Code signing identities → Android
   keystores → Add keystore**, com o arquivo `ravenn-upload.jks` e as senhas do `LEIA-ME.txt` (pasta
   `C:\Users\Tadeu\projetos\ravenn-chave-android`). **Reference name: `ravenn_upload`**.
2. Rode o workflow **Android → Google Play** (Start new build). O passo de publicar falha nesta primeira
   vez (normal), mas o `.aab` fica em **Artifacts**: baixe.
3. No Play Console: **Testar e lançar → Teste interno → Criar nova versão**, aceite o **Play App Signing**
   (o Google guarda a chave do app) e envie o `.aab`.

## 4. Conta de serviço (Codemagic e servidor do Ravenn)

Uma conta de serviço do Google Cloud serve para as duas coisas: o Codemagic enviar versões e o servidor
do Ravenn conferir as assinaturas.

1. Em https://console.cloud.google.com crie (ou escolha) um projeto, ex. `ravenn`.
2. Ative a **Google Play Android Developer API** (APIs e serviços → Biblioteca).
3. **IAM → Contas de serviço → Criar**: nome `ravenn-play`. Depois, em **Chaves → Adicionar chave → JSON**:
   baixa um arquivo `.json`.
4. No Play Console: **Usuários e permissões → Convidar novos usuários**, e-mail da conta de serviço
   (termina em `iam.gserviceaccount.com`), com acesso ao app Ravenn e as permissões **Ver dados
   financeiros**, **Gerenciar pedidos e assinaturas** e **Lançar apps para canais de teste** (e, na hora
   de publicar, **Lançar para produção**).
5. Codemagic: **Environment variables**, grupo **`google_play`**, variável
   `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` (secreta) com o conteúdo do `.json`.
6. Vercel: variável `GOOGLE_PLAY_CONTA_SERVICO` com o mesmo conteúdo do `.json` (pode colar o JSON inteiro).

## 5. Criar a assinatura (Play Console)

1. **Monetizar → Produtos → Assinaturas → Criar assinatura**:
   - **ID do produto: `me.ravenn.app.mensal`** (exatamente assim; está no código)
   - Nome: `Ravenn mensal`
2. Dentro dela, **Adicionar plano básico**:
   - **ID do plano básico: `mensal`** (está no código), renovação automática, **1 mês**.
   - Preço: Brasil **R$ 15,00** (ou o valor que quiser; o app mostra o preço que vem da loja).
   - Ative o plano.
3. **Não crie oferta de teste grátis**: todo mundo já ganha 30 dias grátis no próprio Ravenn ao criar a conta.
4. Para receber, configure o **Perfil de pagamentos** (Configuração → Perfil de pagamentos) com conta bancária.
   O Google fica com 15% das assinaturas.

## 6. Avisos do Google para o Ravenn (Pub/Sub)

1. Google Cloud (mesmo projeto) → **Pub/Sub → Tópicos → Criar tópico**: `ravenn-play`.
2. No tópico, **Permissões → Adicionar principal**: `google-play-developer-notifications@system.gserviceaccount.com`
   com o papel **Editor do Pub/Sub** (Pub/Sub Publisher).
3. **Criar assinatura** no tópico: tipo **Push**, endpoint
   `https://ravenn.me/api/google/notificacoes?chave=UMA-SENHA-LONGA` (invente uma senha longa).
4. Vercel: variável `GOOGLE_PLAY_CHAVE_AVISOS` com essa mesma senha.
5. Play Console → **Monetizar → Configuração da monetização → Notificações em tempo real**: tópico
   `projects/<id-do-projeto>/topics/ravenn-play` → **Enviar mensagem de teste** → Salvar.

## 7. Supabase e Vercel

1. Supabase → **SQL Editor**: rode `supabase/migrations/0018_google.sql` (no projeto principal e no de testes).
   **Rode antes de publicar o site com esta versão**: a tela Assinatura lê as colunas novas.
2. Vercel: confira `GOOGLE_PLAY_CONTA_SERVICO` e `GOOGLE_PLAY_CHAVE_AVISOS` e faça um novo deploy.

## 8. Testar e publicar

1. **Testadores de licença** (Configuração → Teste de licença): adicione os e-mails Google de quem vai
   testar. Para eles a compra é de teste: não cobra e o mês renova em ~5 minutos.
2. **Teste interno**: adicione os testadores, mande o link de participação, instale pela Play Store,
   entre numa conta de teste e assine em **Conta → Assinatura**.
3. **Teste fechado** (conta pessoal): crie uma faixa de teste fechado, cadastre **12 ou mais pessoas**
   e mantenha por **14 dias**. No `codemagic.yaml`, `track: alpha` envia direto para ela.
4. Depois disso: **Produção → Solicitar acesso à produção** e enviar a versão para revisão.
   Quando o app estiver publicado, troque `submit_as_draft: true` por `false` no `codemagic.yaml`.

Observação: em 2026 o Google e a Apple mudaram regras de pagamento no Brasil (acordos com o CADE). A
compra pelo Google Play sempre é aceita; trocar por link para pagar no site é algo para avaliar depois.
