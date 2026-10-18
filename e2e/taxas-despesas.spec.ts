import { expect, test, type Page } from "@playwright/test";
import { PREFIXO, agendar, criarCliente, dataSorteada, nomeUnico } from "./ajuda";

async function salvarTaxas(
  page: Page,
  taxas: { credito: string; comissao?: string; contasFixas?: string },
) {
  await page.goto("/conta");
  await page.getByLabel("Crédito").fill(taxas.credito);
  if (taxas.contasFixas !== undefined) {
    await page.getByText("Estúdio próprio", { exact: true }).click();
    await page.getByLabel("Contas fixas por mês").fill(taxas.contasFixas);
  } else {
    await page.getByText("Pago comissão ao estúdio", { exact: true }).click();
    await page.getByLabel("Comissão do estúdio").fill(taxas.comissao ?? "");
  }
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
}

test.afterEach(async ({ page }) => {
  // Zera as taxas para não afetar os outros testes.
  await salvarTaxas(page, { credito: "", contasFixas: "" });
  await expect(page.getByText("Configurações salvas.")).toBeVisible();
  await salvarTaxas(page, { credito: "", comissao: "" });
  await expect(page.getByText("Configurações salvas.")).toBeVisible();
});

test("taxa da maquininha fica no pagamento e entra no resultado com comissão e despesas", async ({
  page,
}) => {
  await salvarTaxas(page, { credito: "150", comissao: "10" });
  await expect(page.getByText("Use percentuais de 0 a 100. Ex.: 3,5")).toBeVisible();

  await page.getByLabel("Crédito").fill("5");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Configurações salvas.")).toBeVisible();

  const cliente = nomeUnico("Sara");
  await criarCliente(page, cliente);
  await agendar(page, {
    cliente,
    data: dataSorteada(),
    inicio: "15:00",
    fim: "18:00",
    novaTatuagem: "Fênix",
    valor: "1000",
  });
  await page.getByRole("link", { name: "Registrar sinal" }).click();
  await page.getByLabel("Valor recebido").fill("1000");
  await page.getByText("Crédito", { exact: true }).click();
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page.getByText("Taxa da maquininha R$ 50,00 · sobra R$ 950,00")).toBeVisible();

  const despesa = `${PREFIXO} Tintas ${Date.now().toString(36)}`;
  await page.goto("/financeiro");
  await page.getByRole("link", { name: "Despesa" }).click();
  await page.getByLabel("Descrição").fill(despesa);
  await page.getByLabel("Valor").fill("120,50");
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page).toHaveURL(/\/financeiro\?mes=\d{4}-\d{2}$/);
  await expect(page.getByRole("listitem").filter({ hasText: despesa })).toContainText("R$ 120,50");
  await expect(page.getByRole("listitem").filter({ hasText: despesa })).toContainText("Material");

  const resultado = page.getByRole("region", { name: "Resultado do mês" });
  await expect(resultado.getByText("Comissão do estúdio (10%)")).toBeVisible();
  await expect(resultado.getByText("Lucro")).toBeVisible();

  // Estúdio próprio: no lugar da comissão entram as contas fixas.
  await salvarTaxas(page, { credito: "5", contasFixas: "1.800" });
  await expect(page.getByText("Configurações salvas.")).toBeVisible();
  await page.goto("/financeiro");
  await expect(resultado.getByText("Contas fixas")).toBeVisible();
  await expect(resultado.getByText("− R$ 1.800,00")).toBeVisible();
  await expect(resultado.getByText("Comissão do estúdio")).toHaveCount(0);

  await page.getByRole("listitem").filter({ hasText: despesa }).getByRole("button", { name: "Excluir" }).click();
  await page.getByRole("button", { name: "Sim, excluir" }).click();
  await expect(page.getByText(despesa)).toHaveCount(0);
});
