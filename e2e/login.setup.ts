import { expect, test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Garante que a conta de teste existe no projeto de testes (já confirmada).
async function criarContaDeTeste() {
  const chave = process.env.TESTE_SUPABASE_SECRET_KEY;
  if (!chave) return;
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false },
  });
  const { error } = await admin.auth.admin.createUser({
    email: process.env.TESTE_EMAIL!,
    password: process.env.TESTE_SENHA!,
    email_confirm: true,
    user_metadata: { nome: "Conta de teste" },
  });
  if (error && error.code !== "email_exists") throw error;
}

// Faz login uma vez e guarda a sessão para os outros testes.
setup("entrar com a conta de teste", async ({ page }) => {
  await criarContaDeTeste();
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(process.env.TESTE_EMAIL!);
  await page.getByLabel("Senha").fill(process.env.TESTE_SENHA!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  await page.context().storageState({ path: "playwright/.auth/usuario.json" });
});
