import { expect, test } from "@playwright/test";

// Páginas que o Stripe e a App Store conferem: abrem sem login.
test.describe("sem login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("página inicial mostra o que é o Ravenn e o preço", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("O estúdio inteiro");
    await expect(page.getByText("R$ 15", { exact: true })).toBeVisible();
    await expect(page.getByText("30 dias grátis, sem cartão.")).toBeVisible();

    // "Começar grátis" abre o login já no cadastro, com o aviso dos termos.
    await page.getByRole("link", { name: "Começar grátis" }).first().click();
    await expect(page).toHaveURL(/\/login\?modo=criar$/);
    await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible();
    await expect(page.getByRole("link", { name: "termos de uso" })).toBeVisible();
  });

  test("termos, suporte e privacidade abrem e se ligam pelo rodapé", async ({ page }) => {
    await page.goto("/termos");
    await expect(page.getByRole("heading", { name: "Termos de uso" })).toBeVisible();
    await expect(page.getByText(/custa R\$\s15 por mês/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "5. Reembolso e arrependimento" })).toBeVisible();

    await page.getByRole("navigation", { name: "Páginas do Ravenn" }).getByRole("link", { name: "Suporte" }).click();
    await expect(page).toHaveURL(/\/suporte$/);
    await page.getByText("Como cancelo a assinatura?").click();
    await expect(page.getByText(/Gerenciar assinatura/)).toBeVisible();

    await page.getByRole("navigation", { name: "Páginas do Ravenn" }).getByRole("link", { name: "Privacidade" }).click();
    await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
    await expect(page.getByText(/Stripe/).first()).toBeVisible();
  });
});

test("logado, a página inicial vai direto para a tela Hoje", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/hoje$/);
});
