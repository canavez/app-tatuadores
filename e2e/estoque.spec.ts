import { expect, test } from "@playwright/test";
import { PREFIXO } from "./ajuda";

test("escolhe itens prontos, ajusta quantidade e avisa quando está acabando", async ({ page }) => {
  const proprio = `${PREFIXO} Tinta vermelha ${Date.now().toString(36)}`;

  // Item do catálogo + um item próprio.
  await page.goto("/estoque/adicionar");
  await page.getByText("Batoque G", { exact: true }).click();
  await page.getByLabel("Nome do item").fill(proprio);
  await page.getByLabel("Categoria").selectOption("tintas");
  await page.getByRole("button", { name: "Adicionar ao estoque" }).click();
  await expect(page).toHaveURL(/\/estoque$/);
  await expect(page.getByRole("link", { name: "Batoque G" })).toBeVisible();

  // O item adicionado some da lista de escolha.
  await page.goto("/estoque/adicionar");
  await expect(page.getByText("Batoque G", { exact: true })).toHaveCount(0);

  // Mais e menos.
  await page.goto("/estoque");
  const quantidade = page.getByLabel(`Quantidade de ${proprio}`);
  await expect(quantidade).toContainText("0");
  await page.getByRole("button", { name: `Somar 1 em ${proprio}` }).click();
  await expect(quantidade).toContainText("1");
  await page.getByRole("button", { name: `Somar 1 em ${proprio}` }).click();
  await expect(quantidade).toContainText("2");
  await page.getByRole("button", { name: `Tirar 1 de ${proprio}` }).click();
  await expect(quantidade).toContainText("1");

  // Estoque mínimo: com 3 e mínimo 2 não avisa; com 2 avisa (aqui e na tela Hoje).
  await page.getByRole("link", { name: proprio }).click();
  await expect(page.getByRole("heading", { name: proprio })).toBeVisible();
  await page.getByLabel("Quantidade", { exact: true }).fill("3");
  await page.getByLabel("Estoque mínimo").fill("2");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page).toHaveURL(/\/estoque$/);
  const alerta = page.getByRole("region", { name: "Acabando" });
  await expect(alerta.getByText(proprio)).toHaveCount(0);

  await page.getByRole("button", { name: `Tirar 1 de ${proprio}` }).click();
  await expect(alerta).toContainText(`${proprio} (2)`);

  await page.goto("/hoje");
  await expect(page.getByRole("link", { name: new RegExp(`Acabando: ${escapar(proprio)}`) })).toBeVisible();

  // Limpa o que o teste criou (o Batoque G não tem o prefixo da limpeza automática).
  for (const nome of [proprio, "Batoque G"]) {
    await page.goto("/estoque");
    await page.getByRole("link", { name: nome }).click();
    await expect(page.getByRole("heading", { name: nome })).toBeVisible();
    await page.getByRole("button", { name: "Excluir item" }).click();
    await page.getByRole("button", { name: "Sim, excluir" }).click();
    await expect(page).toHaveURL(/\/estoque$/);
    await expect(page.getByRole("link", { name: nome })).toHaveCount(0);
  }
});

function escapar(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
