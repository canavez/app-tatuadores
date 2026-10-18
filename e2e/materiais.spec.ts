import { expect, test, type Page } from "@playwright/test";
import { PREFIXO, agendar, criarCliente, dataSorteada, nomeUnico } from "./ajuda";

async function criarItem(page: Page, nome: string, quantidade: number) {
  await page.goto("/estoque/adicionar");
  await page.getByLabel("Nome do item").fill(nome);
  await page.getByLabel("Categoria").selectOption("cartuchos");
  await page.getByRole("button", { name: "Adicionar ao estoque" }).click();
  await expect(page).toHaveURL(/\/estoque$/);
  await page.getByRole("link", { name: nome }).click();
  await expect(page.getByRole("heading", { name: nome })).toBeVisible();
  await page.getByLabel("Quantidade", { exact: true }).fill(String(quantidade));
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page).toHaveURL(/\/estoque$/);
}

async function estoqueDe(page: Page, nome: string) {
  await page.goto("/estoque");
  return page.getByLabel(`Quantidade de ${nome}`);
}

test("concluir a sessão registra os cartuchos usados e desconta do estoque", async ({ page }) => {
  const cartucho = `${PREFIXO} Cartucho 3RL ${Date.now().toString(36)}`;
  await criarItem(page, cartucho, 5);

  const cliente = nomeUnico("Tom");
  await criarCliente(page, cliente);
  await agendar(page, { cliente, data: dataSorteada(), inicio: "13:00", fim: "15:00", novaTatuagem: "Rosa" });
  await page.getByRole("button", { name: "Sinal pago / confirmar" }).click();
  const urlSessao = page.url();

  // Marcar como realizada abre a tela de materiais.
  await page.getByRole("link", { name: "Marcar como realizada" }).click();
  await expect(page.getByRole("heading", { name: "Sessão realizada" })).toBeVisible();
  await page.getByRole("button", { name: `Somar 1 em ${cartucho}` }).click();
  await page.getByRole("button", { name: `Somar 1 em ${cartucho}` }).click();
  await page.getByRole("button", { name: "Salvar e concluir" }).click();
  await expect(page).toHaveURL(urlSessao);
  await expect(page.getByText("Realizado", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Materiais usados" })).toContainText(`2 × ${cartucho}`);
  await expect(await estoqueDe(page, cartucho)).toContainText("3");

  // Corrigir para 1 devolve 1 ao estoque.
  await page.goto(urlSessao);
  await page.getByRole("region", { name: "Materiais usados" }).getByRole("link", { name: "Editar" }).click();
  await expect(page.getByLabel(`Usados de ${cartucho}`)).toHaveText("2");
  await page.getByRole("button", { name: `Tirar 1 de ${cartucho}` }).click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("region", { name: "Materiais usados" })).toContainText(`1 × ${cartucho}`);
  await expect(await estoqueDe(page, cartucho)).toContainText("4");

  // Excluir a sessão devolve o que foi usado.
  await page.goto(urlSessao);
  await page.getByRole("button", { name: "Excluir sessão" }).click();
  await page.getByRole("button", { name: "Sim, excluir" }).click();
  await expect(page).toHaveURL(/\/agenda$/);
  await expect(await estoqueDe(page, cartucho)).toContainText("5");
});

test("dá para pular os materiais ao concluir", async ({ page }) => {
  const cliente = nomeUnico("Ugo");
  await criarCliente(page, cliente);
  await agendar(page, { cliente, data: dataSorteada(), inicio: "16:00", fim: "17:00", novaTatuagem: "Lua" });
  await page.getByRole("button", { name: "Sinal pago / confirmar" }).click();
  await page.getByRole("link", { name: "Marcar como realizada" }).click();
  await expect(page.getByRole("heading", { name: "Sessão realizada" })).toBeVisible();
  await page.getByRole("button", { name: /^(Pular|Concluir sessão)$/ }).click();
  await expect(page.getByText("Realizado", { exact: true })).toBeVisible();
});
