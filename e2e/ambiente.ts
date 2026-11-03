// Os testes rodam num projeto Supabase só deles, nunca no do app de verdade.
// .env.local tem o projeto real; .env.test.local (fora do git) tem o de testes:
//   TESTE_SUPABASE_URL, TESTE_SUPABASE_ANON_KEY, TESTE_SUPABASE_SECRET_KEY,
//   TESTE_EMAIL e TESTE_SENHA (conta criada sozinha no primeiro teste).
export function usarProjetoDeTestes() {
  process.loadEnvFile(".env.local");
  process.loadEnvFile(".env.test.local");

  const real = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const teste = process.env.TESTE_SUPABASE_URL;
  if (!teste || !process.env.TESTE_SUPABASE_ANON_KEY) {
    throw new Error(
      "Falta o projeto Supabase de testes: preencha TESTE_SUPABASE_URL e " +
        "TESTE_SUPABASE_ANON_KEY no .env.test.local (os testes não rodam no banco real).",
    );
  }
  if (teste === real) {
    throw new Error("TESTE_SUPABASE_URL é o mesmo projeto do app de verdade. Use outro projeto.");
  }

  // O servidor dos testes (e o Next, que não sobrescreve variáveis já definidas) usa o de testes.
  process.env.NEXT_PUBLIC_SUPABASE_URL = teste;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.TESTE_SUPABASE_ANON_KEY;
}
