import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { erro } = await searchParams;
  return (
    <LoginForm
      erroRetorno={erro === "login" ? "Não foi possível concluir o login. Tente de novo." : undefined}
    />
  );
}
