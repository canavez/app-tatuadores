import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { criarCliente, nomeUnico } from "./ajuda";

test.describe("sem login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a política de privacidade abre sem login", async ({ page }) => {
    await page.goto("/privacidade");
    await expect(page).toHaveURL(/\/privacidade$/);
    await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
    await expect(page.getByText("Conta → Excluir minha conta")).toBeVisible();
  });

  // Usa uma conta descartável (a conta de teste dos outros testes continua intacta).
  test("excluir minha conta apaga a conta e os dados", async ({ page }, info) => {
    test.skip(info.project.name !== "computador", "uma vez basta");
    const chave = process.env.TESTE_SUPABASE_SECRET_KEY;
    test.skip(!chave, "precisa da chave secreta do projeto de testes");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const email = `descartavel-${Date.now().toString(36)}@teste.ravenn`;
    const senha = `Senha-${crypto.randomUUID()}`;
    const admin = createClient(url, chave!, { auth: { persistSession: false } });
    const { data: criado, error } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });
    if (error) throw error;

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(senha);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/hoje$/);
    await criarCliente(page, nomeUnico("Descartável"));

    await page.goto("/conta");
    await page.getByRole("link", { name: "Excluir minha conta" }).click();
    await expect(page).toHaveURL(/\/conta\/excluir$/);

    // Sem digitar EXCLUIR, nada acontece.
    await page.getByLabel("Para confirmar, digite EXCLUIR").fill("sim");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    await expect(page.getByText("Digite EXCLUIR para confirmar.")).toBeVisible();

    await page.getByLabel("Para confirmar, digite EXCLUIR").fill("excluir");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    await expect(page).toHaveURL(/\/login\?conta=excluida$/);
    await expect(page.getByText("Sua conta e todos os seus dados foram excluídos.")).toBeVisible();

    // A conta não existe mais, e os clientes dela foram junto.
    const { data: usuario } = await admin.auth.admin.getUserById(criado.user.id);
    expect(usuario.user).toBeNull();
    const { count } = await admin
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("tatuador_id", criado.user.id);
    expect(count).toBe(0);
  });
});
