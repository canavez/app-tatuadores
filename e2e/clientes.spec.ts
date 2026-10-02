import { expect, test } from "@playwright/test";
import { criarCliente, nomeUnico } from "./ajuda";

test("cadastro só exige o nome e não pede anamnese", async ({ page }) => {
  await page.goto("/clientes/novo");
  await expect(page.getByText("Anamnese")).toHaveCount(0);

  const nome = nomeUnico("Ana");
  await criarCliente(page, nome);
  await expect(page.getByText("Anamnese não preenchida.")).toBeVisible();
});

test("edita dados, busca e mostra links de contato", async ({ page }) => {
  const nome = nomeUnico("Bruno");
  const id = await criarCliente(page, nome);

  await page.goto(`/clientes/${id}/editar`);
  await page.getByLabel("Telefone").fill("(11) 91234-5678");
  await page.getByLabel("Instagram").fill("@bruno.ink");
  await page.getByLabel("Data de nascimento").fill("2010-01-01");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
    "href",
    "https://wa.me/5511912345678",
  );
  await expect(page.getByRole("link", { name: "Instagram" })).toHaveAttribute(
    "href",
    "https://instagram.com/bruno.ink",
  );
  await expect(page.getByText("Menor de idade")).toBeVisible();

  await page.goto(`/clientes?q=${encodeURIComponent("bruno.ink")}`);
  await expect(page.getByRole("link", { name: new RegExp(nome.replace(/[[\]]/g, "\\$&")) })).toBeVisible();
});

test("editar sem mexer na anamnese não cria anamnese vazia", async ({ page }) => {
  const id = await criarCliente(page, nomeUnico("Carla"));
  await page.goto(`/clientes/${id}/editar`);
  await page.getByLabel("Telefone").fill("11999990000");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Anamnese não preenchida.")).toBeVisible();
});

test("anamnese com alertas aparece em destaque", async ({ page }) => {
  const id = await criarCliente(page, nomeUnico("Diego"));
  await page.goto(`/clientes/${id}/editar`);
  await page.getByLabel("Diabetes").check();
  await page.getByLabel("Tendência a queloide").check();
  await page.getByLabel("Alergias").fill("látex");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByText("⚠ Atenção na anamnese")).toBeVisible();
  await expect(page.getByText("Diabetes")).toBeVisible();
  await expect(page.getByText("Alergia: látex")).toBeVisible();

  // Desmarcar tudo mantém a anamnese, agora sem alertas.
  await page.goto(`/clientes/${id}/editar`);
  await expect(page.getByLabel("Diabetes")).toBeChecked();
  await page.getByLabel("Diabetes").uncheck();
  await page.getByLabel("Tendência a queloide").uncheck();
  await page.getByLabel("Alergias").fill("");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Anamnese: nenhum ponto de atenção.")).toBeVisible();
});

test("nada a declarar registra anamnese sem alertas", async ({ page }) => {
  const id = await criarCliente(page, nomeUnico("Elisa"));
  await page.goto(`/clientes/${id}/editar`);
  await page.getByLabel("Cliente respondeu e não tem nada a declarar").check();
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Anamnese: nenhum ponto de atenção.")).toBeVisible();
});

test("excluir cliente pede confirmação", async ({ page }) => {
  const nome = nomeUnico("Fábio");
  await criarCliente(page, nome);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Excluir cliente" }).click();
  await expect(page).toHaveURL(/\/clientes$/);
  await expect(page.getByText(nome)).toHaveCount(0);
});
