import { expect, test, type Page } from "@playwright/test";
import { criarCliente, nomeUnico } from "./ajuda";

/** Uma imagem PNG de verdade para enviar (um recorte da própria tela). */
async function imagemDeTeste(page: Page) {
  return { name: "foto.png", mimeType: "image/png", buffer: await page.screenshot({ clip: { x: 0, y: 0, width: 300, height: 200 } }) };
}

test("adiciona e remove a foto do cliente", async ({ page }) => {
  const nome = nomeUnico("Wagner");
  await criarCliente(page, nome);

  await page.getByLabel("Escolher foto").setInputFiles(await imagemDeTeste(page));
  await expect(page.getByRole("img", { name: `Foto de ${nome}` })).toBeVisible();

  // A foto aparece também na lista de clientes.
  const ficha = page.url();
  await page.goto(`/clientes?q=${encodeURIComponent(nome)}`);
  await expect(page.getByRole("img", { name: `Foto de ${nome}` })).toBeVisible();

  await page.goto(ficha);
  await page.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByRole("img", { name: `Foto de ${nome}` })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Adicionar foto" })).toBeVisible();
});

test("adiciona e remove a foto do tatuador na Conta", async ({ page }) => {
  await page.goto("/conta");
  await page.getByLabel("Escolher foto").setInputFiles(await imagemDeTeste(page));
  await expect(page.getByRole("button", { name: "Trocar foto" })).toBeVisible();
  await page.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByRole("button", { name: "Adicionar foto" })).toBeVisible();
});
