import { expect, test } from "@playwright/test";
import { agendar, criarCliente, dataSorteada, nomeUnico } from "./ajuda";

test("dia em linha do tempo: horário livre abre a nova sessão já preenchida", async ({ page }) => {
  const cliente = nomeUnico("Vera");
  await criarCliente(page, cliente);
  const data = dataSorteada();
  await agendar(page, { cliente, data, inicio: "10:00", fim: "12:00", novaTatuagem: "Serpente" });
  await expect(page.getByRole("heading", { name: "10:00 – 12:00" })).toBeVisible();

  // Horário de trabalho padrão: 9h às 20h.
  await page.goto(`/agenda?dia=${data}`);
  await expect(page.getByRole("link", { name: "Livre · 09:00 – 10:00" })).toBeVisible();
  await page.getByRole("link", { name: "Livre · 12:00 – 20:00" }).click();

  await expect(page.getByLabel("Início")).toHaveValue("12:00");
  await expect(page.getByLabel("2 h")).toBeChecked();
  await expect(page.getByText("Termina às 14:00")).toBeVisible();

  // Trocar a duração recalcula o término.
  await page.getByText("3 h", { exact: true }).click();
  await expect(page.getByText("Termina às 15:00")).toBeVisible();

  await page.getByLabel("Cliente").selectOption({ label: cliente });
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("heading", { name: "12:00 – 15:00" })).toBeVisible();

  await page.goto(`/agenda?dia=${data}`);
  await expect(page.getByRole("link", { name: "Livre · 15:00 – 20:00" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Livre · 12:00/ })).toHaveCount(0);
});
