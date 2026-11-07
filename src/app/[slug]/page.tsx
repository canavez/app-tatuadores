import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { buscarPerfil } from "./dados";
import { FormOrcamento } from "./form-orcamento";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const perfil = await buscarPerfil((await params).slug);
  if (!perfil) return { title: "Página não encontrada · Ravenn" };
  return {
    title: `${perfil.nome} · Orçamento de tatuagem`,
    description: perfil.bio ?? `Peça um orçamento de tatuagem para ${perfil.nome}.`,
  };
}

/** Página pública do tatuador (ravenn.me/<link>): o cliente pede um orçamento. */
export default async function PaginaDoTatuador({ params }: PageProps<"/[slug]">) {
  const perfil = await buscarPerfil((await params).slug);
  if (!perfil) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-16 pt-[calc(env(safe-area-inset-top)+2rem)]">
      <header className="flex flex-col items-center gap-3 text-center">
        <Avatar nome={perfil.nome} foto={perfil.fotoUrl} tamanho="pagina" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{perfil.nome}</h1>
          {perfil.bio && <p className="mt-2 whitespace-pre-line text-sm text-muted">{perfil.bio}</p>}
        </div>
      </header>

      {perfil.aceitando ? (
        <section className="card flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Pedir orçamento</h2>
            <p className="text-sm text-muted">
              Conte sua ideia. {perfil.nome.split(" ")[0]} responde pelo WhatsApp.
            </p>
          </div>
          <FormOrcamento tatuadorId={perfil.tatuador_id} nomeTatuador={perfil.nome} />
        </section>
      ) : (
        <p className="card text-center text-sm text-muted">
          {perfil.nome.split(" ")[0]} não está recebendo pedidos de orçamento no momento.
        </p>
      )}

      <footer className="flex items-center justify-center gap-2 text-xs text-muted">
        Feito com
        <Link href="/" aria-label="Ravenn">
          <Image src="/logo.png" alt="Ravenn" width={640} height={203} className="h-4 w-auto opacity-80" />
        </Link>
      </footer>
    </main>
  );
}
