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

test("faixa de dias corre como carrossel sem trocar o dia escolhido", async ({ page }) => {
  await page.goto("/agenda?dia=2026-10-14");
  const dia = (nome: string) => page.getByRole("link", { name: nome });
  await expect(dia("domingo, 18 de outubro")).toBeInViewport();
  await expect(dia("segunda-feira, 19 de outubro")).not.toBeInViewport();

  // Arrastar um pouco anda poucos dias.
  const caixa = (await dia("quarta-feira, 14 de outubro").boundingBox())!;
  const x = caixa.x + caixa.width / 2;
  const y = caixa.y + caixa.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - caixa.width * 2, y, { steps: 10 });
  await page.mouse.up();
  await expect(dia("terça-feira, 20 de outubro")).toBeInViewport();
  await expect(dia("segunda-feira, 12 de outubro")).not.toBeInViewport();
  await expect(page).toHaveURL(/dia=2026-10-14$/);

  // A seta pula uma semana, e o destaque continua só no dia escolhido.
  await page.getByRole("link", { name: "Próxima semana" }).click();
  await expect(dia("terça-feira, 27 de outubro")).toBeInViewport();
  await expect(page).toHaveURL(/dia=2026-10-14$/);
  await expect(page.locator('[aria-current="date"]')).toHaveCount(1);

  // Tocar num dia escolhe ele sem a faixa pular.
  await dia("sábado, 24 de outubro").click();
  await expect(page).toHaveURL(/dia=2026-10-24$/);
  await expect(dia("terça-feira, 27 de outubro")).toBeInViewport();
});
