import { MenuInferior, MenuSuperior } from "@/components/navegacao";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MenuSuperior />
      {/* Espaço no fim para o conteúdo não ficar atrás do menu inferior. */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:px-6 md:py-8">
        {children}
      </main>
      <MenuInferior />
    </div>
  );
}
