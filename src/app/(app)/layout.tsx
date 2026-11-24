import { MenuInferior, MenuSuperior } from "@/components/navegacao";
import { LembretesNoCelular } from "@/components/lembretes-no-celular";
import { TransicaoDeTela } from "@/components/transicao";
import { Avisos } from "@/components/avisos";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    // A tela é uma moldura fixa: só o conteúdo rola. O menu de baixo fica por cima do fim
    // do conteúdo (translúcido, com o conteúdo passando borrado por trás), preso à moldura.
    // Menu com "position: fixed" ficava fora do lugar no app instalado no iPhone.
    <div className="altura-tela relative flex flex-col overflow-hidden print:overflow-visible">
      <MenuSuperior />
      <main className="flex-1 overflow-y-auto overscroll-contain print:overflow-visible">
        <TransicaoDeTela>
          {/* Espaço no fim para o menu e o botão "+" não cobrirem o último item. */}
          <div className="mx-auto w-full max-w-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+9.5rem)] md:px-6 md:py-8">
            {children}
          </div>
        </TransicaoDeTela>
      </main>
      <MenuInferior />
      <Avisos />
      <LembretesNoCelular />
    </div>
  );
}
