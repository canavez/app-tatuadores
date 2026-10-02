import { Topo } from "@/components/topo";
import { ClienteForm } from "../../cliente-form";
import { buscarAnamnese, buscarCliente } from "../buscar-cliente";

export default async function EditarClientePage({ params }: PageProps<"/clientes/[id]/editar">) {
  const { id } = await params;
  const [cliente, anamnese] = await Promise.all([buscarCliente(id), buscarAnamnese(id)]);

  return (
    <>
      <Topo titulo="Editar cliente" voltar={`/clientes/${id}`} />
      <ClienteForm cliente={cliente} anamnese={anamnese} />
    </>
  );
}
