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
  const idHoje = page.url().split("/agenda/")[1];
  await agendar(page, { cliente, data: diaBrasilia(1), inicio, fim });
  await expect(page.getByRole("heading", { name: `${inicio} – ${fim}` })).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/hoje$/);
  const nome = escapar(cliente);
  await expect(page.getByRole("link", { name: new RegExp(`${inicio}.*${nome}.*Caveira`) })).toBeVisible();
  // As pendências aparecem na lista de hoje ou, se a sessão já está acontecendo, no
  // destaque dela; o destaque também pode ser a sessão de amanhã, do mesmo cliente.
  for (const pendencia of [
    "Preencher anamnese",
    "Coletar assinatura do termo",
    "Sinal não registrado",
    "Definir o valor da sessão",
  ]) {
    await expect(page.getByRole("link", { name: new RegExp(`${pendencia}.*${nome}`) }).first()).toBeVisible();
  }

  // O lembrete do cliente aparece (no destaque da próxima sessão ou na lista de amanhã).
  await expect(page.locator('a[href*="wa.me/5511999998888"]').first()).toBeVisible();

  // Resolver uma pendência pelo atalho tira ela da lista.
  // O sinal da sessão de hoje (o link leva ao pagamento dela).
  const sinalDeHoje = page.locator(`a[href="/agenda/${idHoje}/pagamento"]`);
  await sinalDeHoje.first().click();
  await page.getByLabel("Valor recebido").fill("100");
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page.getByText("Confirmado", { exact: true })).toBeVisible();

  await page.goto("/hoje");
  await expect(page.getByRole("link", { name: new RegExp(`Preencher anamnese.*${nome}`) }).first()).toBeVisible();
  await expect(sinalDeHoje).toHaveCount(0);
});
