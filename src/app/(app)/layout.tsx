import { MenuInferior, MenuSuperior } from "@/components/navegacao";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    // A tela é uma moldura fixa: só o conteúdo rola, e o menu é a última peça dela.
    // Menu com "position: fixed" ficava fora do lugar no app instalado no iPhone.
    <div className="relative flex h-dvh flex-col overflow-hidden print:h-auto print:overflow-visible">
      <MenuSuperior />
      <main className="flex-1 overflow-y-auto overscroll-contain print:overflow-visible">
        {/* Espaço no fim para o botão "+" não cobrir o último item. */}
        <div className="mx-auto w-full max-w-3xl px-4 pb-24 md:px-6 md:py-8">{children}</div>
      </main>
      <MenuInferior />
    </div>
  );
}
