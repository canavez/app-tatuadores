import { expect, test } from "@playwright/test";
import { agendar, criarCliente, dataSorteada, nomeUnico } from "./ajuda";

test("sinal pela sessão confirma; pagamento do restante quita e entra no resumo do mês", async ({
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
  await expect(page.getByText("R$ 0,00 pago de R$ 1.500,00 · falta R$ 1.500,00")).toBeVisible();
  const urlSessao = page.url();

  // Registrar sinal já vem com "Sinal" marcado e volta para a sessão confirmada.
  await page.getByRole("link", { name: "Registrar sinal" }).click();
  await expect(page.getByLabel("Sinal")).toBeChecked();
  await page.getByLabel("Valor recebido").fill("300");
  await page.getByText("Dinheiro", { exact: true }).click();
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page).toHaveURL(urlSessao);
  await expect(page.getByText("Confirmado", { exact: true })).toBeVisible();
  await expect(page.getByText("R$ 300,00 pago de R$ 1.500,00 · falta R$ 1.200,00")).toBeVisible();

  // O próximo pagamento já sugere o valor que falta.
  await page.getByRole("link", { name: /pago de/ }).click();
  await page.getByRole("link", { name: "Registrar pagamento" }).click();
  await expect(page.getByLabel("Pagamento", { exact: true })).toBeChecked();
  await expect(page.getByLabel("Valor recebido")).toHaveValue("1200,00");
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page.getByRole("heading", { name: "Financeiro" })).toBeVisible();
  await expect(page.getByText("Falta")).toBeVisible();
  await expect(page.getByText("R$ 1.500,00", { exact: true })).toBeVisible();

  await page.goto("/financeiro");
  await expect(page.getByRole("link", { name: new RegExp(`${escapar(cliente)}.*R\\$\\s1\\.200,00`) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`${escapar(cliente)}.*R\\$\\s300,00`) })).toBeVisible();
});

test("valor inválido é recusado e excluir pagamento volta o saldo", async ({ page }) => {
  const cliente = nomeUnico("Pedro");
  const id = await criarCliente(page, cliente);
  await agendar(page, {
    cliente,
    data: dataSorteada(),
    inicio: "10:00",
    fim: "12:00",
    novaTatuagem: "Âncora",
  });

  await page.goto(`/clientes/${id}`);
  await page.getByRole("link", { name: /Definir valor/ }).click();
  await page.getByLabel("Valor combinado").fill("abc");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Valor inválido. Ex.: 1500 ou 1.500,00")).toBeVisible();

  await page.getByLabel("Valor combinado").fill("800,00");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("R$ 800,00")).toBeVisible();

  await page.getByRole("link", { name: "Registrar pagamento" }).click();
  await page.getByLabel("Valor recebido").fill("200");
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page.getByText("R$ 600,00")).toBeVisible();

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByText("Nenhum pagamento ainda.")).toBeVisible();
  await expect(page.getByText("R$ 800,00").first()).toBeVisible();

  // Voltar leva de novo ao cliente, que mostra o valor definido.
  await page.getByRole("link", { name: "Voltar" }).click();
  await expect(page.getByText("R$ 0,00 de R$ 800,00")).toBeVisible();
});

function escapar(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
