import { LoginForm } from "./login-form";

/** Quais logins sociais estão ativados no Supabase (os botões só aparecem para esses). */
async function provedoresAtivos(): Promise<{ google: boolean; apple: boolean }> {
  try {
    const resposta = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      next: { revalidate: 300 },
    });
    const { external } = (await resposta.json()) as { external?: Record<string, boolean> };
    return { google: !!external?.google, apple: !!external?.apple };
  } catch {
    return { google: false, apple: false };
  }
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { erro, conta, modo } = await searchParams;
  return (
    <LoginForm
      provedores={await provedoresAtivos()}
      modoInicial={modo === "criar" ? "criar" : "entrar"}
      aviso={conta === "excluida" ? "Sua conta e todos os seus dados foram excluídos." : undefined}
      erroRetorno={erro === "login" ? "Não foi possível concluir o login. Tente de novo." : undefined}
    />
  );
}
