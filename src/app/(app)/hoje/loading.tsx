import { Caixa, CardsEsqueleto, TopoEsqueleto } from "@/components/esqueleto";

export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <TopoEsqueleto />
      <div className="flex flex-col gap-4">
        <Caixa className="h-44 rounded-2xl" />
        <Caixa className="mt-2 h-3 w-24 rounded-md" />
        <CardsEsqueleto quantos={3} altura="h-14" />
      </div>
    </div>
  );
}
