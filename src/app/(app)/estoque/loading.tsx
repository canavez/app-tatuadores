import { Caixa, ListaEsqueleto, TopoEsqueleto } from "@/components/esqueleto";

export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <TopoEsqueleto subtitulo={false} />
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <Caixa key={i} className="h-8 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <ListaEsqueleto quantos={6} foto={false} />
      </div>
    </div>
  );
}
