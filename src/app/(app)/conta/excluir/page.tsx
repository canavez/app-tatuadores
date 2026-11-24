import Link from "next/link";
import { Topo } from "@/components/topo";
import { createClient } from "@/lib/supabase/server";
import { ExcluirForm } from "./excluir-form";

export default async function ExcluirContaPage() {
  // A assinatura da Apple e a do Google Play só a própria pessoa cancela (o Ravenn não cancela por ela).
  const supabase = await createClient();
  const { data: lojas } = await supabase.from("assinaturas").select("apple_status, google_status").maybeSingle();
  const renova = (status?: string | null) => status === "ativa" || status === "cobranca_falhou" || status === "pausada";
  const appleRenova = renova(lojas?.apple_status);
  const googleRenova = renova(lojas?.google_status);

  return (
    <>
      <Topo titulo="Excluir conta" voltar="/conta" />
      <div className="flex flex-col gap-4">
        <div className="card flex flex-col gap-3 text-sm">
          <p className="font-semibold">Isso apaga para sempre, sem como desfazer:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>sua conta e seu acesso ao Ravenn;</li>
            <li>todos os clientes, com anamneses, termos assinados e fotos;</li>
            <li>agenda, sessões, pagamentos, despesas e relatórios;</li>
            <li>estoque e configurações.</li>
          </ul>
          <p className="text-muted">
            Se quiser guardar algo, exporte antes o relatório financeiro (em Financeiro → Relatório). Saiba mais na{" "}
            <Link href="/privacidade" className="text-lavanda underline">
              política de privacidade
            </Link>
            .
          </p>
        </div>
        {appleRenova && (
          <p className="aviso-erro">
            Sua assinatura é pela Apple e continua sendo cobrada mesmo depois de excluir a conta. Cancele antes no
            iPhone: Ajustes → seu nome → Assinaturas → Ravenn.
          </p>
        )}
        {googleRenova && (
          <p className="aviso-erro">
            Sua assinatura é pelo Google Play e continua sendo cobrada mesmo depois de excluir a conta. Cancele antes
            na Play Store: seu perfil → Pagamentos e assinaturas → Assinaturas → Ravenn.
          </p>
        )}
        <ExcluirForm />
      </div>
    </>
  );
}
