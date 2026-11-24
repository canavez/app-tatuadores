// Telas de carregamento (loading.tsx): caixas cinzas que brilham no lugar do conteúdo
// enquanto os dados chegam. A tela troca na hora do toque, sem parecer travada.

/** Uma caixa cinza com brilho passando. */
export function Caixa({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`esqueleto rounded-xl ${className}`} />;
}

/** Cabeçalho da tela (o mesmo espaço do Topo), com texto pequeno e título. */
export function TopoEsqueleto({ voltar = false, subtitulo = true }: { voltar?: boolean; subtitulo?: boolean }) {
  return (
    <div className="-mx-4 mb-4 border-b border-border px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] max-md:instalado:pt-[calc(env(safe-area-inset-top)+1.75rem)] md:mx-0 md:border-0 md:px-0 md:pt-0">
      <div className="flex min-h-10 items-center gap-3">
        {voltar && <Caixa className="size-8 rounded-full" />}
        <div className="flex flex-1 flex-col gap-1.5">
          {subtitulo && <Caixa className="h-3 w-28 rounded-md" />}
          <Caixa className="h-6 w-44 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Lista de cards, como as sessões do dia. */
export function CardsEsqueleto({ quantos = 3, altura = "h-16" }: { quantos?: number; altura?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: quantos }, (_, i) => (
        <Caixa key={i} className={`${altura} rounded-2xl`} />
      ))}
    </div>
  );
}

/** Lista em um card só, com bolinha (foto) e duas linhas, como a de clientes. */
export function ListaEsqueleto({ quantos = 6, foto = true }: { quantos?: number; foto?: boolean }) {
  return (
    <div className="card divide-y divide-border p-0">
      {Array.from({ length: quantos }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {foto && <Caixa className="size-10 shrink-0 rounded-full" />}
          <div className="flex flex-1 flex-col gap-1.5">
            <Caixa className="h-4 w-2/5 rounded-md" />
            <Caixa className="h-3 w-3/5 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tela inteira genérica (para as telas de detalhe). */
export function TelaEsqueleto({ voltar = true }: { voltar?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <TopoEsqueleto voltar={voltar} />
      <div className="flex flex-col gap-3">
        <Caixa className="h-28 rounded-2xl" />
        <Caixa className="h-20 rounded-2xl" />
        <CardsEsqueleto quantos={2} altura="h-14" />
      </div>
    </div>
  );
}
