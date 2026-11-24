import { Caixa, ListaEsqueleto, TopoEsqueleto } from "@/components/esqueleto";

export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <TopoEsqueleto subtitulo={false} />
      <div className="flex flex-col gap-4">
        <Caixa className="mx-auto h-5 w-36 rounded-md" />
        <Caixa className="h-44 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Caixa className="h-24 rounded-2xl" />
          <Caixa className="h-24 rounded-2xl" />
        </div>
        <Caixa className="h-11 rounded-xl" />
        <ListaEsqueleto quantos={4} foto={false} />
      </div>
    </div>
  );
}
