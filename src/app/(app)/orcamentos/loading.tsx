import { Caixa, CardsEsqueleto, TopoEsqueleto } from "@/components/esqueleto";

export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <TopoEsqueleto voltar />
      <div className="flex flex-col gap-4">
        <Caixa className="h-28 rounded-2xl" />
        <Caixa className="h-8 w-48 rounded-full" />
        <CardsEsqueleto quantos={3} altura="h-40" />
      </div>
    </div>
  );
}
