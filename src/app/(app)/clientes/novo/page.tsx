import { Topo } from "@/components/topo";
import { ClienteForm } from "../cliente-form";

export default function NovoClientePage() {
  return (
    <>
      <Topo titulo="Novo cliente" voltar="/clientes" />
      <ClienteForm />
    </>
  );
}
