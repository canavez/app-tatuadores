import { createClient } from "@/lib/supabase/server";
import { nomeDoUsuario } from "@/lib/usuario";
import { limparSlug, linkDaPagina, type Perfil } from "@/lib/orcamentos";
import { Topo } from "@/components/topo";
import { CompartilharLink } from "@/app/(app)/orcamentos/compartilhar-link";
import { PaginaForm } from "./pagina-form";

export default async function MinhaPaginaPage() {
  const supabase = await createClient();
  const [{ data }, usuario] = await Promise.all([
    supabase.from("perfis").select("tatuador_id, slug, nome, bio, foto, aceitando").maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const perfil = data as Perfil | null;
  const nome = nomeDoUsuario(usuario.data.user);

  return (
    <>
      <Topo titulo="Minha página" voltar="/orcamentos" subtitulo="Página de orçamento" />
      <div className="flex flex-col gap-5">
        <p className="text-sm text-muted">
          Seus clientes abrem o seu link, contam a ideia da tatuagem, o lugar do corpo e mandam imagens de referência. O
          pedido chega em Orçamentos e você responde pelo WhatsApp.
        </p>
        {perfil && (
          <section className="card flex flex-col gap-2 py-4">
            <p className="text-xs text-muted">Seu link</p>
            <CompartilharLink link={linkDaPagina(perfil.slug)} />
          </section>
        )}
        <PaginaForm
          existe={!!perfil}
          slug={perfil?.slug ?? limparSlug(nome)}
          nome={perfil?.nome ?? nome}
          bio={perfil?.bio ?? ""}
          aceitando={perfil?.aceitando ?? true}
        />
      </div>
    </>
  );
}
