import { Caixa, ListaEsqueleto, TopoEsqueleto } from "@/components/esqueleto";

export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <TopoEsqueleto subtitulo={false} />
      <Caixa className="mb-4 h-12 rounded-xl" />
      <ListaEsqueleto quantos={7} />
    </div>
  );
}
