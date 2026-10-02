import { ClienteForm } from "../cliente-form";

export default function NovoClientePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Novo cliente</h1>
      <ClienteForm />
    </div>
  );
}
