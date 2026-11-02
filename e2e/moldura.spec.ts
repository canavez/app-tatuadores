import { expect, test } from "@playwright/test";

const ABAS = ["/hoje", "/agenda", "/clientes", "/financeiro", "/estoque", "/conta"];

// O menu de baixo é a última peça da moldura do app (não "position: fixed"):
// fica colado no fim da tela em todas as abas, mesmo com o conteúdo rolado.
test("menu de baixo fica colado no fim da tela em todas as abas", async ({ page }, info) => {
  test.skip(info.project.name !== "celular", "o menu de baixo só aparece no celular");
  const altura = page.viewportSize()!.height;
  const menu = page.getByRole("navigation", { name: "Menu principal" });

  for (const aba of ABAS) {
    await page.goto(aba);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const antes = (await menu.boundingBox())!;
    expect(Math.round(antes.y + antes.height), aba).toBe(altura);

    // Rola o conteúdo até o fim: menu e título continuam no lugar.
    await page.locator("main").evaluate((el) => el.scrollTo(0, el.scrollHeight));
    const depois = (await menu.boundingBox())!;
    expect(Math.round(depois.y + depois.height), aba).toBe(altura);
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  }
});
