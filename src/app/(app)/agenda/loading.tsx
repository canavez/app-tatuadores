import { Caixa, CardsEsqueleto, TopoEsqueleto } from "@/components/esqueleto";

export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <TopoEsqueleto subtitulo={false} />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }, (_, i) => (
          <Caixa key={i} className="h-16 w-12 shrink-0 rounded-2xl" />
        ))}
      </div>
      <Caixa className="mb-3 mt-6 h-4 w-40 rounded-md" />
      <CardsEsqueleto quantos={4} altura="h-20" />
    </div>
  );
}
