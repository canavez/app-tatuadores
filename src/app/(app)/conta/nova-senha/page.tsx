import { Topo } from "@/components/topo";
import { NovaSenhaForm } from "./nova-senha-form";

export default function NovaSenhaPage() {
  return (
    <>
      <Topo titulo="Nova senha" voltar="/conta" />
      <NovaSenhaForm />
    </>
  );
}
