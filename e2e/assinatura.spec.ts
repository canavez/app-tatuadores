import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { situacaoDa } from "../src/lib/assinatura-regras";

test.describe("regras da assinatura", () => {
  const agora = new Date("2026-11-04T12:00:00Z");

  test("teste grátis, ativa e vencida", () => {
    expect(situacaoDa({ teste_ate: "2026-11-14T12:00:00Z", pago_ate: null, origem: null }, agora)).toEqual({
      situacao: "teste",
      ate: "2026-11-14T12:00:00Z",
      dias: 10,
    });
    expect(
      situacaoDa({ teste_ate: "2026-10-01T00:00:00Z", pago_ate: "2026-12-01T00:00:00Z", origem: "apple" }, agora),
    ).toEqual({ situacao: "ativa", ate: "2026-12-01T00:00:00Z", origem: "apple" });
    expect(
      situacaoDa({ teste_ate: "2026-10-01T00:00:00Z", pago_ate: "2026-11-01T00:00:00Z", origem: "web" }, agora),
    ).toEqual({ situacao: "vencida", desde: "2026-11-01T00:00:00Z" });
  });
});

test.describe("conta descartável", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("período grátis, bloqueio ao vencer e liberação ao pagar", async ({ page }, info) => {
    test.skip(info.project.name !== "computador", "uma vez basta");
    const chave = process.env.TESTE_SUPABASE_SECRET_KEY;
    test.skip(!chave, "precisa da chave secreta do projeto de testes");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const admin = createClient(url, chave!, { auth: { persistSession: false } });
    const email = `assinatura-${Date.now().toString(36)}@teste.ravenn`;
    const senha = `Senha-${crypto.randomUUID()}`;
    const { data: criado, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
    if (error) throw error;
    const id = criado.user.id;
    const mudar = async (campos: Record<string, string | null>) => {
      const { error } = await admin.from("assinaturas").update(campos).eq("tatuador_id", id);
      if (error) throw error;
    };

    try {
      // A conta nova já nasce com 30 dias grátis.
      await page.goto("/login");
      await page.getByLabel("E-mail").fill(email);
      await page.getByLabel("Senha").fill(senha);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).toHaveURL(/\/hoje$/);
      await page.goto("/conta");
      await expect(page.getByRole("link", { name: /Período grátis.*Faltam 30 dias/ })).toBeVisible();

      // O tatuador não consegue estender o próprio acesso.
      const proprio = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false },
      });
      await proprio.auth.signInWithPassword({ email, password: senha });
      const { data: alterado } = await proprio
        .from("assinaturas")
        .update({ pago_ate: "2100-01-01T00:00:00Z" })
        .eq("tatuador_id", id)
        .select();
      expect(alterado ?? []).toHaveLength(0);

      // Faltando poucos dias, a tela Hoje avisa.
      await mudar({ teste_ate: new Date(Date.now() + 3 * 86_400_000 - 60_000).toISOString() });
      await page.goto("/hoje");
      await expect(page.getByRole("link", { name: /período grátis termina em 3 dias/ })).toBeVisible();

      // Vencido: o app manda para a tela de assinatura, mas Conta e relatório continuam abertos.
      await mudar({ teste_ate: new Date(Date.now() - 60_000).toISOString() });
      await page.goto("/agenda");
      await expect(page).toHaveURL(/\/assinatura$/);
      await expect(page.getByText("Seu período grátis terminou")).toBeVisible();
      await page.goto("/conta");
      await expect(page).toHaveURL(/\/conta$/);
      await page.goto("/financeiro/relatorio");
      await expect(page).toHaveURL(/\/financeiro\/relatorio/);

      // Pagou: libera de novo.
      await mudar({ pago_ate: new Date(Date.now() + 30 * 86_400_000).toISOString(), origem: "web" });
      await page.goto("/agenda");
      await expect(page).toHaveURL(/\/agenda$/);
      await page.goto("/assinatura");
      await expect(page.getByText(/Assinatura ativa até/)).toBeVisible();
    } finally {
      await admin.auth.admin.deleteUser(id);
    }
  });
});
