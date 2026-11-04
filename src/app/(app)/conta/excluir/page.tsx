import Link from "next/link";
import { Topo } from "@/components/topo";
import { ExcluirForm } from "./excluir-form";

export default function ExcluirContaPage() {
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
        <ExcluirForm />
      </div>
    </>
  );
}
