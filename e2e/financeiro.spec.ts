import { expect, test } from "@playwright/test";
import { agendar, criarCliente, dataSorteada, nomeUnico } from "./ajuda";

test("sinal confirma a sessão; pagamento do restante quita e entra no resumo do mês", async ({
  page,
}) => {
  const cliente = nomeUnico("Olga");
  await criarCliente(page, cliente);
  await agendar(page, {
    cliente,
    data: dataSorteada(),
    inicio: "14:00",
    fim: "17:00",
    novaTatuagem: "Dragão",
    valor: "1.500",
  });
  await expect(page.getByText("R$ 0,00 pago · falta R$ 1.500,00")).toBeVisible();
  const urlSessao = page.url();

  // Sessão aguardando sinal: o formulário já vem com "Sinal" e volta confirmada.
  await page.getByRole("link", { name: "Registrar sinal" }).click();
  await expect(page.getByLabel("Sinal")).toBeChecked();
  await page.getByLabel("Valor recebido").fill("300");
  await page.getByText("Dinheiro", { exact: true }).click();
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page).toHaveURL(urlSessao);
  await expect(page.getByText("Confirmado", { exact: true })).toBeVisible();
  await expect(page.getByText("R$ 300,00 pago · falta R$ 1.200,00")).toBeVisible();

  // O próximo pagamento já sugere o valor que falta.
  await page.getByRole("link", { name: "Registrar pagamento" }).click();
  await expect(page.getByLabel("Pagamento", { exact: true })).toBeChecked();
  await expect(page.getByLabel("Valor recebido")).toHaveValue("1200,00");
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page.getByText("R$ 1.500,00 pago · quitado")).toBeVisible();

  await page.goto("/financeiro");
  await expect(page.getByRole("link", { name: new RegExp(`${escapar(cliente)}.*R\\$\\s1\\.200,00`) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`${escapar(cliente)}.*R\\$\\s300,00`) })).toBeVisible();
});

test("valor por sessão: inválido é recusado, editar define e excluir pagamento volta o saldo", async ({
  page,
}) => {
  const cliente = nomeUnico("Pedro");
  const id = await criarCliente(page, cliente);
  await agendar(page, {
    cliente,
    data: dataSorteada(),
    inicio: "10:00",
    fim: "12:00",
    novaTatuagem: "Âncora",
    valor: "abc",
  });
  await expect(page.getByText("Valor inválido. Ex.: 1500 ou 1.500,00")).toBeVisible();

  // O erro não apaga o que já foi preenchido: basta corrigir o valor e salvar.
  await expect(page.getByLabel("Descrição")).toHaveValue("Âncora");
  await expect(page.getByLabel("Início")).toHaveValue("10:00");
  await page.getByLabel("Valor da sessão").fill("");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Valor da sessão não definido.")).toBeVisible();

  await page.getByRole("link", { name: "Informar valor" }).click();
  await page.getByLabel("Valor da sessão").fill("800,00");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("R$ 0,00 pago · falta R$ 800,00")).toBeVisible();

  await page.getByRole("link", { name: "Registrar sinal" }).click();
  await page.getByLabel("Valor recebido").fill("200");
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page.getByText("R$ 200,00 pago · falta R$ 600,00")).toBeVisible();

  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await page.getByRole("button", { name: "Sim, excluir" }).click();
  await expect(page.getByText("R$ 0,00 pago · falta R$ 800,00")).toBeVisible();

  // No cliente, a sessão mostra o valor e a tatuagem mostra o total.
  await page.goto(`/clientes/${id}`);
  await expect(page.getByText("Total R$ 800,00")).toBeVisible();
});

test("sessão cancelada não entra no a receber", async ({ page }) => {
  const cliente = nomeUnico("Quésia");
  await criarCliente(page, cliente);
  await agendar(page, {
    cliente,
    data: dataSorteada(),
    inicio: "09:00",
    fim: "10:00",
    novaTatuagem: "Estrela",
    valor: "350",
  });
  await expect(page.getByText("falta R$ 350,00")).toBeVisible();
  await page.locator('summary[aria-label="Mais ações"]').click();
  await page.getByRole("button", { name: "Cancelar sessão" }).click();
  await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();
  await expect(page.getByText("R$ 0,00 pago")).toBeVisible();
  await expect(page.getByText("falta R$ 350,00")).toHaveCount(0);

  await page.goto("/financeiro");
  await expect(page.getByText(cliente)).toHaveCount(0);
});

function escapar(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
