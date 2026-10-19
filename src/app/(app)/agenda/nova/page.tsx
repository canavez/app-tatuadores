import { Topo } from "@/components/topo";
import { dataValida } from "@/lib/agenda";
import { SessaoForm } from "../sessao-form";
import { opcoesDoFormulario } from "../dados";

export default async function NovaSessaoPage({ searchParams }: PageProps<"/agenda/nova">) {
  const { cliente, data, inicio, fim } = await searchParams;
  const hora = (v: unknown) => (typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : undefined);
  const { clientes, tatuagens } = await opcoesDoFormulario();

  return (
    <>
      <Topo titulo="Nova sessão" voltar="/agenda" />
      <SessaoForm
        clientes={clientes}
        tatuagens={tatuagens}
        clienteInicial={typeof cliente === "string" ? cliente : undefined}
        dataInicial={dataValida(data) ? data : undefined}
        inicioInicial={hora(inicio)}
        fimInicial={hora(fim)}
      />
    </>
  );
}
