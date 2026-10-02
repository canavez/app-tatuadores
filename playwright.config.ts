import { defineConfig, devices } from "@playwright/test";

// E-mail e senha da conta de teste (arquivo fora do git).
process.loadEnvFile(".env.test.local");

const PORTA = 3100;

export default defineConfig({
  testDir: "./e2e",
  // Todos os testes usam a mesma conta: rodar um de cada vez evita
  // que um teste mexa nos horários da agenda de outro.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalTeardown: "./e2e/limpeza.ts",
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "login", testMatch: /login\.setup\.ts/ },
    {
      name: "computador",
      use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/usuario.json" },
      dependencies: ["login"],
    },
    {
      name: "celular",
      use: { ...devices["Pixel 7"], storageState: "playwright/.auth/usuario.json" },
      dependencies: ["login"],
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORTA}`,
    url: `http://localhost:${PORTA}/login`,
    timeout: 240_000,
    reuseExistingServer: false,
  },
});
