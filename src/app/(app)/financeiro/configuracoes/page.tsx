import { buscarConfiguracoes } from "@/lib/configuracoes";
import { Topo } from "@/components/topo";
import { TaxasForm } from "./taxas-form";

export default async function TaxasECustosPage() {
  const config = await buscarConfiguracoes();
  return (
    <>
      <Topo titulo="Taxas e custos" voltar="/financeiro" />
      <TaxasForm config={config} />
    </>
  );
}
