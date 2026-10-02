import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { sair } from "@/app/login/actions";
import { Topo } from "@/components/topo";
import { Avatar } from "@/components/avatar";

export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const nome = (user?.user_metadata?.nome as string | undefined) ?? "";

  return (
    <>
      <Topo titulo="Conta" />
      <div className="card flex items-center gap-4">
        <Avatar nome={nome || user?.email || "?"} tamanho="grande" />
        <div className="min-w-0">
          {nome && <p className="truncate text-lg font-semibold">{nome}</p>}
          <p className="truncate text-sm text-muted">{user?.email}</p>
        </div>
      </div>

      <form action={sair} className="mt-4">
        <button
          type="submit"
          className="card flex w-full items-center gap-3 py-4 text-left font-medium text-red-600 dark:text-red-400"
        >
          <LogOut className="size-5" />
          Sair
        </button>
      </form>
    </>
  );
}
