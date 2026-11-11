import { createClient } from "@/lib/supabase/server";
import { clientePeloTelefone, type ClienteDoOrcamento, type Orcamento } from "@/lib/orcamentos";

/**
 * Cliente de cada orçamento: o que já foi ligado a ele ou, se ainda não, um cliente
 * cadastrado com o mesmo celular (sugestão: o tatuador confirma na tela do pedido).
 */
export async function clientesDosOrcamentos(orcamentos: Pick<Orcamento, "id" | "telefone" | "cliente_id">[]) {
  const resultado = new Map<string, { cliente: ClienteDoOrcamento; ligado: boolean }>();
  if (orcamentos.length === 0) return resultado;
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("id, nome, telefone").not("telefone", "is", null);
  const clientes = (data ?? []) as ClienteDoOrcamento[];
  const porId = new Map(clientes.map((c) => [c.id, c]));
  for (const o of orcamentos) {
    const ligado = o.cliente_id ? porId.get(o.cliente_id) : undefined;
    if (o.cliente_id) {
      // Ligado a um cliente sem telefone: busca o nome à parte.
      const cliente =
        ligado ??
        ((await supabase.from("clientes").select("id, nome, telefone").eq("id", o.cliente_id).maybeSingle())
          .data as ClienteDoOrcamento | null);
      if (cliente) resultado.set(o.id, { cliente, ligado: true });
      continue;
    }
    const achado = clientePeloTelefone(clientes, o.telefone);
    if (achado) resultado.set(o.id, { cliente: achado, ligado: false });
  }
  return resultado;
}
