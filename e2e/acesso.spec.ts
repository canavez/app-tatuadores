import { expect, test } from "@playwright/test";

test.describe("sem login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("telas protegidas mandam para o login", async ({ page }) => {
    for (const rota of ["/", "/agenda", "/clientes", "/clientes/novo"]) {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/login$/);
    }
  });

  test("arquivos para instalar o app abrem sem login", async ({ request }) => {
    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBe(true);
    expect((await manifest.json()).name).toBe("Ravenn");
    for (const icone of ["/icone-192.png", "/icone-512.png", "/icon.svg", "/apple-icon.png"]) {
      expect((await request.get(icone)).ok(), icone).toBe(true);
    }
  });

  test("senha errada mostra aviso", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(process.env.TESTE_EMAIL!);
    await page.getByLabel("Senha").fill("senha-errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  });
});

test("logado, /login volta para a agenda", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/agenda$/);
  await expect(page.getByRole("link", { name: "Agenda" }).first()).toBeVisible();
});

test("Sair desloga só este aparelho", async ({ page, browser }) => {
  // Outro "aparelho": um navegador separado, com login próprio.
  const outro = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const pagina = await outro.newPage();
  await pagina.goto("/login");
  await pagina.getByLabel("E-mail").fill(process.env.TESTE_EMAIL!);
  await pagina.getByLabel("Senha").fill(process.env.TESTE_SENHA!);
  await pagina.getByRole("button", { name: "Entrar" }).click();
  await expect(pagina).toHaveURL(/\/agenda$/);

  await pagina.goto("/conta");
  await pagina.getByRole("button", { name: "Sair" }).click();
  await expect(pagina).toHaveURL(/\/login$/);
  await pagina.goto("/clientes");
  await expect(pagina).toHaveURL(/\/login$/);
  await outro.close();

  // Este aparelho continua logado.
  await page.goto("/clientes");
  await expect(page).toHaveURL(/\/clientes$/);
});
