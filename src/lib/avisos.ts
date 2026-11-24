// Avisos do balão de "salvo". O cookie leva só a chave; o texto fica aqui
// (evita acentos e espaços no cookie).
export const COOKIE_AVISO = "ravenn-aviso";

export const AVISOS = {
  "sessao-salva": "Sessão salva",
  "sessao-excluida": "Sessão excluída",
  "status-mudado": "Status atualizado",
  "pagamento-registrado": "Pagamento registrado",
  "pagamento-excluido": "Pagamento excluído",
  "materiais-salvos": "Materiais salvos",
  "cliente-salvo": "Cliente salvo",
  "cliente-excluido": "Cliente excluído",
  "itens-adicionados": "Itens adicionados ao estoque",
  "item-salvo": "Item salvo",
  "item-excluido": "Item excluído",
  "despesa-registrada": "Despesa registrada",
  "despesa-excluida": "Despesa excluída",
  "taxas-salvas": "Taxas e custos salvos",
  "orcamento-excluido": "Orçamento excluído",
  "orcamento-arquivado": "Orçamento arquivado",
  "orcamento-reaberto": "Orçamento reaberto",
  "virou-cliente": "Cliente cadastrado",
  "termo-assinado": "Termo assinado",
  "termo-excluido": "Termo excluído",
} as const;

export type Aviso = keyof typeof AVISOS;
