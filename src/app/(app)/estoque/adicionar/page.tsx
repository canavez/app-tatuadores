import { createClient } from "@/lib/supabase/server";
import { CATALOGO } from "@/lib/estoque";
import { Topo } from "@/components/topo";
import { AdicionarForm } from "./adicionar-form";

export default async function AdicionarItensPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("itens_estoque").select("nome");
  const jaTenho = new Set((data ?? []).map((i) => i.nome as string));

  // Mostra só o que ainda não está no estoque.
  const grupos = CATALOGO.map((g) => ({ ...g, itens: g.itens.filter((nome) => !jaTenho.has(nome)) })).filter(
    (g) => g.itens.length > 0,
  );

  return (
    <>
      <Topo titulo="Adicionar itens" voltar="/estoque" />
      <p className="mb-4 text-sm text-muted">
        Toque nos materiais que você usa. Depois é só ajustar as quantidades no estoque.
      </p>
      <AdicionarForm grupos={grupos} />
    </>
  );
}
