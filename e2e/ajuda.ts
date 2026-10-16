import { expect, type Page } from "@playwright/test";

// Tudo que os testes criam começa com este prefixo e é apagado no fim (limpeza.ts).
export const PREFIXO = "[teste]";

export function nomeUnico(nome: string): string {
  return `${PREFIXO} ${nome} ${Date.now().toString(36)}`;
}

/** Uma data futura sorteada, para não bater com sessões de outras execuções. */
export function dataSorteada(): string {
  const ano = 2031 + Math.floor(Math.random() * 20);
  const mes = 1 + Math.floor(Math.random() * 12);
  const dia = 1 + Math.floor(Math.random() * 28);
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export async function criarCliente(page: Page, nome: string): Promise<string> {
  await page.goto("/clientes/novo");
  await page.getByLabel("Nome").fill(nome);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("heading", { name: nome })).toBeVisible();
  return page.url().split("/clientes/")[1];
}

export async function agendar(
  page: Page,
  opcoes: {
    cliente: string;
    data: string;
    inicio: string;
    fim: string;
    novaTatuagem?: string;
    valor?: string;
  },
) {
  await page.goto("/agenda/nova");
  await page.getByLabel("Cliente").selectOption({ label: opcoes.cliente });
  if (opcoes.novaTatuagem) {
    await page.getByLabel("Tatuagem").selectOption("nova");
    await page.getByLabel("Descrição").fill(opcoes.novaTatuagem);
  }
  if (opcoes.valor) await page.getByLabel("Valor da sessão").fill(opcoes.valor);
  await page.getByLabel("Data").fill(opcoes.data);
  await page.getByLabel("Início").fill(opcoes.inicio);
  await page.getByLabel("Término").fill(opcoes.fim);
  await page.getByRole("button", { name: "Salvar" }).click();
}
