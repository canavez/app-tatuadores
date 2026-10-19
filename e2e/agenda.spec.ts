import { expect, test } from "@playwright/test";
import { agendar, criarCliente, dataSorteada, nomeUnico } from "./ajuda";

const CONFLITO = "Já existe outra sessão nesse horário. Escolha outro horário.";

test("agenda sessão com nova tatuagem e mostra na semana", async ({ page }) => {
  const cliente = nomeUnico("Gabi");
  await criarCliente(page, cliente);
  const data = dataSorteada();

  await agendar(page, { cliente, data, inicio: "14:00", fim: "16:00", novaTatuagem: "Rosa fineline" });
  await expect(page.getByRole("heading", { name: "14:00 – 16:00" })).toBeVisible();
  await expect(page.getByText("Aguardando sinal")).toBeVisible();
  await expect(page.getByText("Rosa fineline")).toBeVisible();

  // Voltar leva para o dia da sessão na agenda.
  await page.getByRole("link", { name: "Voltar" }).click();
  await expect(page).toHaveURL(`/agenda?dia=${data}`);
  await expect(page.getByRole("link", { name: /14:00\s*16:00.*Rosa fineline/ })).toBeVisible();
});

test("bloqueia horário sobreposto, mas aceita horário colado", async ({ page }) => {
  const cliente = nomeUnico("Heitor");
  await criarCliente(page, cliente);
  const data = dataSorteada();

  await agendar(page, { cliente, data, inicio: "14:00", fim: "16:00", novaTatuagem: "Leão" });
  await expect(page.getByRole("heading", { name: "14:00 – 16:00" })).toBeVisible();

  await agendar(page, { cliente, data, inicio: "15:00", fim: "17:00" });
  await expect(page.getByText(CONFLITO)).toBeVisible();

  await agendar(page, { cliente, data, inicio: "16:00", fim: "18:00" });
  await expect(page.getByRole("heading", { name: "16:00 – 18:00" })).toBeVisible();
});

test("conflito com tatuagem nova não deixa tatuagem órfã", async ({ page }) => {
  const cliente = nomeUnico("Iara");
  const id = await criarCliente(page, cliente);
  const data = dataSorteada();

  await agendar(page, { cliente, data, inicio: "10:00", fim: "12:00", novaTatuagem: "Primeira" });
  await expect(page.getByRole("heading", { name: "10:00 – 12:00" })).toBeVisible();
  await agendar(page, { cliente, data, inicio: "11:00", fim: "13:00", novaTatuagem: "Órfã" });
  await expect(page.getByText(CONFLITO)).toBeVisible();

  await page.goto(`/clientes/${id}`);
  await expect(page.getByText("Primeira")).toBeVisible();
  await expect(page.getByText("Órfã")).toHaveCount(0);
});

test("cadastra cliente novo direto no agendamento", async ({ page }) => {
  const cliente = nomeUnico("Lia");
  const data = dataSorteada();

  await page.goto("/agenda/nova");
  await page.getByLabel("Cliente").selectOption("novo");
  await page.getByLabel("Nome do cliente").fill(cliente);
  await page.getByLabel("Descrição").fill("Borboleta");
  await page.getByLabel("Data").fill(data);
  await page.getByLabel("Início").fill("13:00");
  await page.getByText("Outra", { exact: true }).click();
  await page.getByLabel("Término").fill("14:00");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("heading", { name: "13:00 – 14:00" })).toBeVisible();

  // O cliente aparece em Clientes, pronto para completar o cadastro.
  await page.goto("/clientes");
  await page.getByRole("link", { name: cliente }).click();
  await expect(page.getByRole("heading", { name: cliente })).toBeVisible();
  await expect(page.getByText("Borboleta")).toBeVisible();
});

test("conflito ao agendar cliente novo não deixa cliente órfão", async ({ page }) => {
  const existente = nomeUnico("Mel");
  await criarCliente(page, existente);
  const data = dataSorteada();
  await agendar(page, { cliente: existente, data, inicio: "10:00", fim: "12:00", novaTatuagem: "Lua" });
  await expect(page.getByRole("heading", { name: "10:00 – 12:00" })).toBeVisible();

  const orfao = nomeUnico("Nina");
  await page.goto("/agenda/nova");
  await page.getByLabel("Cliente").selectOption("novo");
  await page.getByLabel("Nome do cliente").fill(orfao);
  await page.getByLabel("Descrição").fill("Sol");
  await page.getByLabel("Data").fill(data);
  await page.getByLabel("Início").fill("11:00");
  await page.getByText("Outra", { exact: true }).click();
  await page.getByLabel("Término").fill("13:00");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(CONFLITO)).toBeVisible();

  await page.goto("/clientes");
  await expect(page.getByText(existente)).toBeVisible();
  await expect(page.getByText(orfao)).toHaveCount(0);
});

test("término antes do início é recusado", async ({ page }) => {
  const cliente = nomeUnico("João");
  await criarCliente(page, cliente);
  await agendar(page, {
    cliente,
    data: dataSorteada(),
    inicio: "16:00",
    fim: "15:00",
    novaTatuagem: "Teste",
  });
  await expect(page.getByText("O horário de término precisa ser depois do início.")).toBeVisible();
});

test("fluxo de status: confirmar, cancelar libera horário, reativar dá conflito", async ({ page }) => {
  const cliente = nomeUnico("Karen");
  await criarCliente(page, cliente);
  const data = dataSorteada();

  await agendar(page, { cliente, data, inicio: "09:00", fim: "11:00", novaTatuagem: "Mandala" });
  await expect(page.getByRole("heading", { name: "09:00 – 11:00" })).toBeVisible();
  const urlPrimeira = page.url();

  await page.locator('summary[aria-label="Mais ações"]').click();

  await page.getByRole("button", { name: "Confirmar sem sinal" }).click();
  await expect(page.getByText("Confirmado", { exact: true })).toBeVisible();

  await page.locator('summary[aria-label="Mais ações"]').click();

  await page.getByRole("button", { name: "Cancelar sessão" }).click();
  await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();

  // Horário cancelado fica livre para outra sessão.
  await agendar(page, { cliente, data, inicio: "09:00", fim: "11:00" });
  await expect(page.getByRole("heading", { name: "09:00 – 11:00" })).toBeVisible();

  // Reativar a primeira agora bate com a nova.
  await page.goto(urlPrimeira);
  await page.getByRole("button", { name: "Reativar sessão" }).click();
  await expect(page.getByText("Não dá para reativar")).toBeVisible();
  await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();
});

test("sessão mostra anamnese e lembrete de WhatsApp", async ({ page }) => {
  const cliente = nomeUnico("Lucas Silva");
  const id = await criarCliente(page, cliente);
  await page.goto(`/clientes/${id}/editar`);
  await page.getByLabel("Telefone").fill("(21) 98888-7777");
  await page.getByLabel("Usa anticoagulante").check();
  await page.getByRole("button", { name: "Salvar" }).click();
  // Espera salvar antes de sair da tela (senão o envio é interrompido).
  await expect(page.getByRole("heading", { name: cliente })).toBeVisible();

  const data = dataSorteada();
  await agendar(page, { cliente, data, inicio: "13:00", fim: "15:00", novaTatuagem: "Âncora" });
  await expect(page.getByText("⚠ Atenção na anamnese")).toBeVisible();

  const lembrete = page.getByRole("link", { name: "Enviar lembrete no WhatsApp" });
  const href = decodeURIComponent((await lembrete.getAttribute("href"))!);
  expect(href).toContain("https://wa.me/5521988887777?text=");
  expect(href).toContain("Olá, [teste]!");
  expect(href).toContain("às 13:00");
});

test("editar sessão muda o horário e excluir remove", async ({ page }) => {
  const cliente = nomeUnico("Marina");
  await criarCliente(page, cliente);
  const data = dataSorteada();
  await agendar(page, { cliente, data, inicio: "18:00", fim: "19:00", novaTatuagem: "Lettering" });

  await page.getByRole("link", { name: "Editar" }).click();
  await expect(page.getByLabel("Início")).toHaveValue("18:00");
  await expect(page.getByLabel("Data")).toHaveValue(data);
  await page.getByText("Outra", { exact: true }).click();
  await page.getByLabel("Término").fill("20:30");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("heading", { name: "18:00 – 20:30" })).toBeVisible();

  await page.locator('summary[aria-label="Mais ações"]').click();

  await page.getByRole("button", { name: "Excluir sessão" }).click();
  await page.getByRole("button", { name: "Sim, excluir" }).click();
  await expect(page).toHaveURL(/\/agenda$/);
});
