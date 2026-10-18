import { expect, test, type Page } from "@playwright/test";
import { agendar, criarCliente, dataSorteada, nomeUnico } from "./ajuda";

async function assinarNoQuadro(page: Page) {
  const quadro = page.getByLabel("Quadro de assinatura");
  await quadro.scrollIntoViewIfNeeded();
  const caixa = (await quadro.boundingBox())!;
  await page.mouse.move(caixa.x + 30, caixa.y + caixa.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(caixa.x + 30 + i * 20, caixa.y + caixa.height / 2 + (i % 2 ? -25 : 25));
  }
  await page.mouse.up();
}

/** Cria cliente + sessão e abre a tela da sessão. */
async function prepararSessao(page: Page, nome: string, nascimento?: string) {
  const id = await criarCliente(page, nome);
  if (nascimento) {
    await page.goto(`/clientes/${id}/editar`);
    await page.getByLabel("Data de nascimento").fill(nascimento);
    await page.getByLabel("CPF").fill("123.456.789-00");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("heading", { name: nome })).toBeVisible();
  }
  await agendar(page, {
    cliente: nome,
    data: dataSorteada(),
    inicio: "10:00",
    fim: "12:00",
    novaTatuagem: "Rosa fineline",
  });
  await expect(page.getByRole("heading", { name: "10:00 – 12:00" })).toBeVisible();
  return id;
}

test("coleta assinatura pela sessão e mostra o termo assinado", async ({ page }) => {
  const nome = nomeUnico("Nina");
  const clienteId = await prepararSessao(page, nome);
  const urlSessao = new URL(page.url()).pathname;

  await page.getByRole("link", { name: /Termo de consentimento.*Pendente/ }).click();
  await expect(page.getByRole("heading", { name: "Termo de consentimento", level: 1 })).toBeVisible();

  // Sem marcar "li e concordo" e sem assinatura: recusa.
  await page.getByRole("button", { name: "Confirmar assinatura" }).click();
  await expect(page.getByText("É preciso marcar que leu e concorda com o termo.")).toBeVisible();

  await page.getByLabel("Li e concordo").check();
  await page.getByRole("button", { name: "Confirmar assinatura" }).click();
  await expect(page.getByText("Falta a assinatura no quadro.")).toBeVisible();

  // O texto acompanha o que é digitado.
  await page.getByLabel("CPF").fill("987.654.321-00");
  await expect(page.getByText(`CPF 987.654.321-00, autorizo`)).toBeVisible();

  await page.getByLabel("Li e concordo").check();
  await page.getByLabel(/Autorizo o uso de fotos/).check();
  await assinarNoQuadro(page);
  await page.getByRole("button", { name: "Confirmar assinatura" }).click();

  await expect(page.getByRole("heading", { name: "Termo assinado" })).toBeVisible();
  await expect(page.getByText(/^Assinado em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/)).toBeVisible();
  await expect(page.getByAltText(/^Assinatura de/)).toBeVisible();
  await expect(page.getByText("Declaro ter 18 anos ou mais.")).toBeVisible();
  await expect(page.getByText(/☑ Autorizo o uso de fotos/)).toBeVisible();

  // Voltar leva de volta à sessão, que agora mostra "Assinado".
  await page.getByRole("link", { name: "Voltar" }).click();
  await expect(page).toHaveURL(urlSessao);
  await expect(page.getByRole("link", { name: /Termo de consentimento.*Assinado/ })).toBeVisible();

  await page.goto(`/clientes/${clienteId}`);
  await expect(page.getByRole("link", { name: "Termo assinado" })).toBeVisible();
});

test("menor de idade exige responsável", async ({ page }) => {
  const nome = nomeUnico("Otto");
  await prepararSessao(page, nome, "2012-05-10");
  await page.getByRole("link", { name: /Termo de consentimento/ }).click();

  await expect(page.getByText("Cliente menor de idade")).toBeVisible();
  await page.getByLabel("Li e concordo").check();
  await assinarNoQuadro(page);
  await page.getByLabel("Nome do responsável").fill("Maria Responsável");
  await page.getByLabel("CPF do responsável").fill("111.222.333-44");
  await page.getByRole("button", { name: "Confirmar assinatura" }).click();

  await expect(page.getByRole("heading", { name: "Termo assinado" })).toBeVisible();
  await expect(page.getByText(/responsável legal, Maria Responsável, CPF 111.222.333-44/)).toBeVisible();
  await expect(page.getByText("Declaro ter 18 anos ou mais.")).toHaveCount(0);
});

test("excluir termo volta para pendente; impressão esconde o menu", async ({ page }) => {
  const nome = nomeUnico("Paula");
  await prepararSessao(page, nome);
  await page.getByRole("link", { name: /Termo de consentimento/ }).click();
  await page.getByLabel("Li e concordo").check();
  await assinarNoQuadro(page);
  await page.getByRole("button", { name: "Confirmar assinatura" }).click();
  await expect(page.getByRole("heading", { name: "Termo assinado" })).toBeVisible();

  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("navigation", { name: "Menu principal" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Imprimir / salvar PDF" })).toBeHidden();
  await page.emulateMedia({ media: "screen" });

  await page.getByRole("button", { name: "Excluir termo" }).click();
  await page.getByRole("button", { name: "Sim, excluir" }).click();
  await expect(page.getByRole("heading", { name: "Termo de consentimento", level: 1 })).toBeVisible();
});

test("nome cadastrado na Conta aparece no termo", async ({ page }) => {
  await page.goto("/conta");
  await page.getByLabel("Seu nome profissional").fill("Estúdio Teste Ravenn");
  await page.getByRole("button", { name: "Salvar nome" }).click();
  await expect(page.getByText("Nome salvo.")).toBeVisible();

  await prepararSessao(page, nomeUnico("Quésia"));
  await page.getByRole("link", { name: /Termo de consentimento/ }).click();
  await expect(page.getByText(/autorizo Estúdio Teste Ravenn a realizar/)).toBeVisible();
  await expect(page.getByText("Seu nome ainda não está cadastrado")).toHaveCount(0);
});
