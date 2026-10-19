"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoLogin = { erro?: string; mensagem?: string } | undefined;

function lerCampos(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("senha") ?? ""),
  };
}

export async function entrar(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(lerCampos(formData));

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { erro: "Confirme seu e-mail antes de entrar (veja sua caixa de entrada)." };
    }
    return { erro: "E-mail ou senha incorretos." };
  }
  redirect("/");
}

export async function criarConta(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const { email, password } = lerCampos(formData);
  const nome = String(formData.get("nome") ?? "").trim();

  if (!nome) return { erro: "Informe seu nome." };
  if (password.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { erro: error.message };
  if (data.session) redirect("/");
  return { mensagem: "Conta criada! Enviamos um link de confirmação para o seu e-mail." };
}

export async function sair() {
  const supabase = await createClient();
  // "local": sai só deste aparelho (o padrão desloga todos os aparelhos).
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}

export async function pedirNovaSenha(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { erro: "Informe o e-mail da sua conta." };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  // O link do e-mail passa pelo /auth/callback, que cria a sessão e leva para a tela de nova senha.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?proximo=/conta/nova-senha`,
  });
  if (error?.status === 429) return { erro: "Muitos pedidos seguidos. Espere alguns minutos e tente de novo." };

  // Mesmo se o e-mail não existir, a resposta é a mesma (não revela quem tem conta).
  return { mensagem: "Se esse e-mail tiver conta no Ravenn, enviamos um link para criar uma nova senha." };
}

export async function trocarSenha(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  if (senha !== confirmacao) return { erro: "As duas senhas não são iguais." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    if (error.code === "same_password") return { erro: "Escolha uma senha diferente da atual." };
    return { erro: "Não foi possível trocar a senha. Tente novamente." };
  }
  redirect("/conta?senha=ok");
}
