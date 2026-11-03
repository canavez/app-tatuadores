import { expect, test } from "@playwright/test";
import { agendar, criarCliente, nomeUnico } from "./ajuda";

/** Data de hoje (+ dias) no horário de Brasília, como o app calcula. */
function diaBrasilia(dias = 0): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000 + dias * 86_400_000).toISOString().slice(0, 10);
}

function escapar(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("mostra as sessões do dia, as pendências e o lembrete de amanhã", async ({ page }, info) => {
  // Cada aparelho usa um horário diferente para não dar conflito entre eles.
  const [inicio, fim] = info.project.name === "celular" ? ["22:00", "22:30"] : ["21:00", "21:30"];
  const cliente = nomeUnico("Rui");
  const id = await criarCliente(page, cliente);
  await page.goto(`/clientes/${id}/editar`);
  await page.getByLabel("Telefone").fill("11999998888");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("heading", { name: cliente })).toBeVisible();

  await agendar(page, { cliente, data: diaBrasilia(), inicio, fim, novaTatuagem: "Caveira" });
  await expect(page.getByText("Valor da sessão não definido.")).toBeVisible();
  await agendar(page, { cliente, data: diaBrasilia(1), inicio, fim });
  await expect(page.getByRole("heading", { name: `${inicio} – ${fim}` })).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/hoje$/);
  const nome = escapar(cliente);
  await expect(page.getByRole("link", { name: new RegExp(`${inicio}.*${nome}.*Caveira`) })).toBeVisible();
  // Só a lista de pendências: o destaque da próxima sessão (a de amanhã, do mesmo
  // cliente) também mostra anamnese, termo e sinal.
  const pendencias = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Pendências" }) });
  for (const pendencia of [
    "Preencher anamnese",
    "Coletar assinatura do termo",
    "Sinal não registrado",
    "Definir o valor da sessão",
  ]) {
    await expect(pendencias.getByRole("link", { name: new RegExp(`${pendencia}.*${nome}`) })).toBeVisible();
  }

  // O lembrete do cliente aparece (no destaque da próxima sessão ou na lista de amanhã).
  await expect(page.locator('a[href*="wa.me/5511999998888"]').first()).toBeVisible();

  // Resolver uma pendência pelo atalho tira ela da lista.
  await pendencias.getByRole("link", { name: new RegExp(`Sinal não registrado.*${nome}`) }).click();
  await page.getByLabel("Valor recebido").fill("100");
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page.getByText("Confirmado", { exact: true })).toBeVisible();

  await page.goto("/hoje");
  await expect(pendencias.getByRole("link", { name: new RegExp(`Preencher anamnese.*${nome}`) })).toBeVisible();
  await expect(pendencias.getByRole("link", { name: new RegExp(`Sinal não registrado.*${nome}`) })).toHaveCount(0);
});
