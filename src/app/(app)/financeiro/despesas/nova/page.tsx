import { hoje } from "@/lib/agenda";
import { Topo } from "@/components/topo";
import { DespesaForm } from "./despesa-form";

export default async function NovaDespesaPage({ searchParams }: PageProps<"/financeiro/despesas/nova">) {
  const { mes: mesParam } = await searchParams;
  const mes = typeof mesParam === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mesParam) ? mesParam : null;
  const diaHoje = hoje();
  // Aberto de outro mês: sugere o primeiro dia dele; no mês atual, hoje.
  const dataInicial = mes && mes !== diaHoje.slice(0, 7) ? `${mes}-01` : diaHoje;
  const voltar = mes ? `/financeiro?mes=${mes}` : "/financeiro";

  return (
    <>
      <Topo titulo="Nova despesa" voltar={voltar} />
      <DespesaForm voltar={voltar} dataInicial={dataInicial} />
    </>
  );
}
