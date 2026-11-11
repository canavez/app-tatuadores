import { expect, test, type Page } from "@playwright/test";
import { nomeUnico } from "./ajuda";

// A conta de testes tem uma página fixa; cada projeto (computador/celular) usa o mesmo link.
const LINK = "teste-ravenn-e2e";

async function criarPagina(page: Page) {
  await page.goto("/conta/pagina");
  await page.getByLabel("Seu link").fill(LINK);
  await page.getByLabel("Nome na página").fill("Estúdio Teste");
  await page.getByLabel("Receber pedidos de orçamento").check();
  await page.getByRole("button", { name: /Criar minha página|Salvar/ }).click();
  await expect(page.getByText("Página salva.")).toBeVisible();
}

test("link reservado não é aceito", async ({ page }) => {
  await page.goto("/conta/pagina");
  await page.getByLabel("Seu link").fill("agenda");
  await page.getByLabel("Nome na página").fill("Estúdio Teste");
  await page.getByRole("button", { name: /Criar minha página|Salvar/ }).click();
  await expect(page.getByText("Esse link é reservado. Escolha outro.")).toBeVisible();
});

test("cliente pede orçamento pela página e o tatuador responde pelo WhatsApp", async ({ page, browser }) => {
  await criarPagina(page);
  const nome = nomeUnico("Marina");

  // Visitante sem conta.
  const visitante = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const pagina = await visitante.newPage();
  await pagina.goto(`/${LINK}`);
  await expect(pagina.getByRole("heading", { name: "Estúdio Teste" })).toBeVisible();
  await pagina.getByLabel("Seu nome").fill(nome);
  await pagina.getByLabel("Celular (WhatsApp)").fill("(11) 98765-4321");
  await pagina.getByLabel("Sua ideia").fill("Uma andorinha fineline, uns 8 cm");
  await pagina.getByLabel("Lugar do corpo").selectOption("Antebraço");
  await pagina.getByLabel("Escolher imagens de referência").setInputFiles({
    name: "ref.png",
    mimeType: "image/png",
    buffer: await pagina.screenshot({ clip: { x: 0, y: 0, width: 300, height: 200 } }),
  });
  await expect(pagina.getByRole("img", { name: "Referência 1" })).toBeVisible();
  await pagina.getByRole("button", { name: "Enviar pedido de orçamento" }).click();
  await expect(pagina.getByText("Pedido enviado!")).toBeVisible();
  await visitante.close();

  // O tatuador vê o pedido.
  await page.goto("/orcamentos");
  const card = page.getByRole("listitem").filter({ hasText: nome });
  await expect(card.getByText("Novo")).toBeVisible();
  await card.getByRole("link", { name: new RegExp(nome.replace(/[[\]]/g, "\\$&")) }).click();
  await expect(page.getByText("Uma andorinha fineline, uns 8 cm")).toBeVisible();
  await expect(page.getByText("Antebraço")).toBeVisible();
  await expect(page.getByRole("img", { name: "Referência 1" })).toBeVisible();

  const whatsapp = page.getByRole("link", { name: "Responder no WhatsApp" });
  await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/5511987654321\?text=/);

  // Apaga no fim (com as imagens).
  await page.getByRole("button", { name: "Excluir orçamento" }).click();
  await page.getByRole("button", { name: "Sim, excluir" }).click();
  await expect(page).toHaveURL(/\/orcamentos$/);
  await expect(page.getByText(nome)).toHaveCount(0);
});

test("link que não existe mostra página não encontrada", async ({ page }) => {
  const resposta = await page.goto("/ninguem-tem-este-link-123");
  expect(resposta?.status()).toBe(404);
});
