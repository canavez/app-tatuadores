import { expect, test as setup } from "@playwright/test";

// Faz login uma vez e guarda a sessão para os outros testes.
setup("entrar com a conta de teste", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(process.env.TESTE_EMAIL!);
  await page.getByLabel("Senha").fill(process.env.TESTE_SENHA!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/agenda$/);
  await page.context().storageState({ path: "playwright/.auth/usuario.json" });
});
