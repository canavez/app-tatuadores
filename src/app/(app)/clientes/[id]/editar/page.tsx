import { ClienteForm } from "../../cliente-form";
import { buscarAnamnese, buscarCliente } from "../buscar-cliente";

export default async function EditarClientePage({ params }: PageProps<"/clientes/[id]/editar">) {
  const { id } = await params;
  const [cliente, anamnese] = await Promise.all([buscarCliente(id), buscarAnamnese(id)]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Editar cliente</h1>
      <ClienteForm cliente={cliente} anamnese={anamnese} />
    </div>
  );
}
