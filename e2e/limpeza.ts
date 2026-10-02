import { createClient } from "@supabase/supabase-js";
import { PREFIXO } from "./ajuda";

// Apaga os clientes criados pelos testes (tatuagens, sessões e anamneses vão junto).
export default async function limpeza() {
  process.loadEnvFile(".env.local");
  process.loadEnvFile(".env.test.local");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { error: erroLogin } = await supabase.auth.signInWithPassword({
    email: process.env.TESTE_EMAIL!,
    password: process.env.TESTE_SENHA!,
  });
  if (erroLogin) throw erroLogin;

  const { error } = await supabase.from("clientes").delete().like("nome", `${PREFIXO}%`);
  if (error) throw error;
}
