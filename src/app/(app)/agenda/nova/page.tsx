import { dataValida } from "@/lib/agenda";
import { SessaoForm } from "../sessao-form";
import { opcoesDoFormulario } from "../dados";

export default async function NovaSessaoPage({ searchParams }: PageProps<"/agenda/nova">) {
  const { cliente, data } = await searchParams;
  const { clientes, tatuagens } = await opcoesDoFormulario();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Nova sessão</h1>
      <SessaoForm
        clientes={clientes}
        tatuagens={tatuagens}
        clienteInicial={typeof cliente === "string" ? cliente : undefined}
        dataInicial={dataValida(data) ? data : undefined}
      />
    </div>
  );
}
