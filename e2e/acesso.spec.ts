import { expect, test } from "@playwright/test";

test.describe("sem login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("telas protegidas mandam para o login", async ({ page }) => {
    for (const rota of ["/", "/hoje", "/agenda", "/clientes", "/clientes/novo"]) {
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

  test("tela de esqueci minha senha abre pelo login e volta", async ({ page }) => {
    // Não envia o e-mail de verdade (o Supabase limita poucos envios por hora).
    await page.goto("/login");
    await page.getByRole("link", { name: "Esqueci minha senha" }).click();
    await expect(page.getByRole("heading", { name: "Esqueci minha senha" })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await page.getByRole("link", { name: "Voltar para o login" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test("trocar senha confere se as duas são iguais", async ({ page }) => {
  await page.goto("/conta");
  await page.getByRole("link", { name: /Trocar senha/ }).click();
  await page.locator('input[name="senha"]').fill("senha-nova-123");
  await page.getByLabel("Repita a nova senha").fill("senha-outra-456");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByText("As duas senhas não são iguais.")).toBeVisible();
});

test.describe("navegador sem JavaScript (ex.: iPad antigo)", () => {
  test.use({ storageState: { cookies: [], origins: [] }, javaScriptEnabled: false });

  test("consegue entrar e salvar um formulário", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(process.env.TESTE_EMAIL!);
    await page.getByLabel("Senha").fill(process.env.TESTE_SENHA!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/hoje$/);

    await page.goto("/conta");
    await page.getByLabel("Seu nome profissional").fill("Estúdio Teste Ravenn");
    await page.getByRole("button", { name: "Salvar nome" }).click();
    await expect(page.getByText("Nome salvo.")).toBeVisible();
  });
});

test("logado, /login volta para a tela Hoje", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(page.getByRole("link", { name: "Hoje" }).first()).toBeVisible();
});

test("Sair desloga só este aparelho", async ({ page, browser }) => {
  // Outro "aparelho": um navegador separado, com login próprio.
  const outro = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const pagina = await outro.newPage();
  await pagina.goto("/login");
  await pagina.getByLabel("E-mail").fill(process.env.TESTE_EMAIL!);
  await pagina.getByLabel("Senha").fill(process.env.TESTE_SENHA!);
  await pagina.getByRole("button", { name: "Entrar" }).click();
  await expect(pagina).toHaveURL(/\/hoje$/);

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
