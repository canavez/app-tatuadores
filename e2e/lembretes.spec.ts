import { expect, test } from "@playwright/test";
import { montarLembretes, type SessaoParaLembrete } from "../src/lib/lembretes";

// Regras dos lembretes do app do iPhone (sem navegador: só a função que monta a lista).
test.describe("lembretes das sessões", () => {
  const agora = new Date("2026-11-04T12:00:00-03:00"); // quarta, 12h em Brasília

  const sessao = (id: string, inicio: string, extra: Partial<SessaoParaLembrete> = {}) =>
    ({
      id,
      inicio: new Date(inicio).toISOString(),
      status: "confirmado",
      cliente: "Miguel Rohrmann",
      tatuagem: "Serpente",
      ...extra,
    }) satisfies SessaoParaLembrete;

  test("1 hora antes de cada sessão, com cliente, tatuagem e sinal", () => {
    const [lembrete, ...resto] = montarLembretes(
      [sessao("a", "2026-11-04T15:00:00-03:00", { status: "agendado" })],
      agora,
    );
    expect(resto).toHaveLength(0); // a véspera (ontem às 20h) já passou
    expect(lembrete.titulo).toBe("Sessão às 15:00");
    expect(lembrete.corpo).toBe("Miguel Rohrmann · Serpente · sinal não registrado");
    expect(lembrete.quando.toISOString()).toBe(new Date("2026-11-04T14:00:00-03:00").toISOString());
    expect(lembrete.url).toBe("/agenda/a");
  });

  test("na véspera às 20h, um resumo do dia seguinte", () => {
    const lembretes = montarLembretes(
      [
        sessao("b", "2026-11-05T15:00:00-03:00", { cliente: "Ana Souza", status: "agendado" }),
        sessao("a", "2026-11-05T10:00:00-03:00"),
      ],
      agora,
    );
    const vespera = lembretes.find((l) => l.titulo.startsWith("Amanhã"))!;
    expect(vespera.titulo).toBe("Amanhã: 2 sessões");
    expect(vespera.corpo).toBe("10:00 Miguel, 15:00 Ana · 1 sem sinal");
    expect(vespera.quando.toISOString()).toBe(new Date("2026-11-04T20:00:00-03:00").toISOString());
    expect(vespera.url).toBe("/agenda?dia=2026-11-05");
    // Em ordem de horário: véspera (20h de hoje), depois 9h e 14h de amanhã.
    expect(lembretes.map((l) => l.titulo)).toEqual(["Amanhã: 2 sessões", "Sessão às 10:00", "Sessão às 15:00"]);
  });

  test("não agenda o que já passou nem repete ids", () => {
    const lembretes = montarLembretes(
      [
        sessao("passou", "2026-11-04T11:00:00-03:00"),
        sessao("daqui-a-pouco", "2026-11-04T12:30:00-03:00"), // 1 h antes já passou
        sessao("c", "2026-11-10T09:00:00-03:00"),
        sessao("d", "2026-11-10T14:00:00-03:00"),
      ],
      agora,
    );
    expect(lembretes.map((l) => l.titulo)).toEqual(["Amanhã: 2 sessões", "Sessão às 09:00", "Sessão às 14:00"]);
    expect(new Set(lembretes.map((l) => l.id)).size).toBe(lembretes.length);
    // O mesmo lembrete tem sempre o mesmo id (reagendar troca, não duplica).
    expect(montarLembretes([sessao("c", "2026-11-10T09:00:00-03:00")], agora)[1].id).toBe(lembretes[1].id);
  });
});

test("no site (fora do app do iPhone) não aparece nada de lembretes", async ({ page }) => {
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.goto("/conta");
  await expect(page.getByRole("heading", { name: "Conta" })).toBeVisible();
  await page.goto("/hoje");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(2000); // o agendamento roda 1,5 s depois de abrir
  await expect(page.getByText("Lembretes das sessões")).toHaveCount(0);
  await expect(page.getByText("Receba lembretes das sessões")).toHaveCount(0);
  expect(erros).toEqual([]);
});
