import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { sair } from "@/app/login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const nome = (user?.user_metadata?.nome as string | undefined) ?? user?.email;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link href="/" className="font-bold tracking-tight">
            Ink Agenda
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/agenda" className="text-muted hover:text-foreground">
              Agenda
            </Link>
            <Link href="/clientes" className="text-muted hover:text-foreground">
              Clientes
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{nome}</span>
            <form action={sair}>
              <button type="submit" className="text-muted underline hover:text-foreground">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
