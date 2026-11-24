import { Caixa, TopoEsqueleto } from "@/components/esqueleto";

export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <TopoEsqueleto subtitulo={false} />
      <div className="flex flex-col gap-4">
        <Caixa className="h-24 rounded-2xl" />
        <Caixa className="h-36 rounded-2xl" />
        <Caixa className="h-36 rounded-2xl" />
      </div>
    </div>
  );
}
