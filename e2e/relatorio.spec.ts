import { expect, test } from "@playwright/test";

test("relatório financeiro abre pelo Financeiro e troca o período", async ({ page }) => {
  await page.goto("/financeiro");
  await page.getByRole("link", { name: "Relatório" }).click();
  await expect(page.getByText("Relatório financeiro", { exact: true })).toBeVisible();
  await expect(page.getByText("Lucro do período")).toBeVisible();
  await expect(page.getByRole("button", { name: "Baixar PDF" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar imagem" })).toBeVisible();

  await page.goto("/financeiro/relatorio?tipo=mes&ref=2026-09");
  await expect(page.getByRole("heading", { name: "Setembro de 2026" })).toBeVisible();
  await expect(page.getByText("Recebido e custos por semana")).toBeVisible();

  await page.getByRole("link", { name: "Trimestre" }).click();
  await expect(page.getByRole("heading", { name: "3º trimestre de 2026 (jul–set)" })).toBeVisible();
  await expect(page.getByText("Recebido e custos por mês")).toBeVisible();

  await page.getByRole("link", { name: "Próximo período" }).click();
  await expect(page.getByRole("heading", { name: "4º trimestre de 2026 (out–dez)" })).toBeVisible();

  await page.getByRole("link", { name: "Ano", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ano de 2026" })).toBeVisible();
  await expect(page.getByText("Resumo mês a mês")).toBeVisible();
});
