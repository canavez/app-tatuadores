import { Topo } from "@/components/topo";
import { dataValida } from "@/lib/agenda";
import { SessaoForm } from "../sessao-form";
import { opcoesDoFormulario } from "../dados";

export default async function NovaSessaoPage({ searchParams }: PageProps<"/agenda/nova">) {
  const { cliente, data } = await searchParams;
  const { clientes, tatuagens } = await opcoesDoFormulario();

  return (
    <>
      <Topo titulo="Nova sessão" voltar="/agenda" />
      <SessaoForm
        clientes={clientes}
        tatuagens={tatuagens}
        clienteInicial={typeof cliente === "string" ? cliente : undefined}
        dataInicial={dataValida(data) ? data : undefined}
      />
    </>
  );
}
