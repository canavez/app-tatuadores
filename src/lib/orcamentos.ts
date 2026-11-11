import { linkWhatsApp } from "@/lib/clientes";

/**
 * Primeiras partes do endereço que são do próprio Ravenn: não podem virar o link de um
 * tatuador (ravenn.me/<link>). Ao criar uma tela nova no topo, coloque o nome aqui.
 */
export const ROTAS_RESERVADAS = [
  "hoje",
  "agenda",
  "clientes",
  "financeiro",
  "estoque",
  "conta",
  "assinatura",
  "tatuagens",
  "orcamentos",
  "orcamento",
  "login",
  "auth",
  "termos",
  "privacidade",
  "suporte",
  "api",
  "admin",
  "ajuda",
  "app",
  "ravenn",
  "www",
  "blog",
  "precos",
  "planos",
];

/** Lugares do corpo que o cliente escolhe no formulário. */
export const LOCAIS_DO_CORPO = [
  "Braço",
  "Antebraço",
  "Mão / dedos",
  "Ombro",
  "Peito",
  "Costela",
  "Barriga",
  "Costas",
  "Coxa",
  "Panturrilha / canela",
  "Pé / tornozelo",
  "Pescoço / nuca",
  "Atrás da orelha",
  "Outro / ainda não sei",
];

export const MAX_IMAGENS = 5;

export type StatusOrcamento = "novo" | "respondido" | "arquivado";

export type Orcamento = {
  id: string;
  nome: string;
  telefone: string;
  descricao: string;
  local_corpo: string | null;
  imagens: string[];
  status: StatusOrcamento;
  cliente_id: string | null;
  criado_em: string;
};

export type Perfil = {
  tatuador_id: string;
  slug: string;
  nome: string;
  bio: string | null;
  foto: string | null;
  aceitando: boolean;
};

/** Deixa o link no formato aceito: minúsculo, sem acento e sem espaço. */
export function limparSlug(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^@/, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

/** Erro do link escolhido, ou null se está bom. */
export function erroDoSlug(slug: string): string | null {
  if (slug.length < 3) return "O link precisa ter pelo menos 3 letras ou números.";
  if (slug.length > 30) return "O link pode ter no máximo 30 caracteres.";
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(slug)) {
    return "Use só letras, números, ponto, hífen ou sublinhado (sem começar ou terminar com eles).";
  }
  if (ROTAS_RESERVADAS.includes(slug)) return "Esse link é reservado. Escolha outro.";
  return null;
}

/** Endereço público da página do tatuador. */
export function linkDaPagina(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ravenn.me").replace(/\/$/, "");
  return `${base}/${slug}`;
}

/** "(11) 98765-4321" a partir de qualquer jeito de digitar. */
export function formatarTelefone(telefone: string): string {
  let d = telefone.replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone;
}

/** Link do WhatsApp para responder o orçamento, já com uma mensagem pronta. */
export function linkResposta(orcamento: Pick<Orcamento, "nome" | "telefone" | "local_corpo">, tatuador: string): string {
  const primeiroNome = orcamento.nome.trim().split(" ")[0];
  const apresentacao = tatuador ? `Aqui é ${tatuador.split(" ")[0]}, tudo bem? ` : "Tudo bem? ";
  const local =
    orcamento.local_corpo && !orcamento.local_corpo.startsWith("Outro") ? ` para ${orcamento.local_corpo.toLowerCase()}` : "";
  const texto =
    `Olá, ${primeiroNome}! ${apresentacao}` +
    `Recebi seu pedido de orçamento da tatuagem${local} pelo Ravenn. Vamos conversar sobre a sua ideia?`;
  return `${linkWhatsApp(orcamento.telefone)}?text=${encodeURIComponent(texto)}`;
}

/** "agora há pouco", "há 3 h", "ontem", "12/10". */
export function quandoChegou(instante: string, agora = new Date()): string {
  const minutos = Math.floor((agora.getTime() - new Date(instante).getTime()) / 60_000);
  if (minutos < 2) return "agora há pouco";
  if (minutos < 60) return `há ${minutos} min`;
  if (minutos < 24 * 60) return `há ${Math.floor(minutos / 60)} h`;
  const dias = Math.floor(minutos / (24 * 60));
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return new Date(instante).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
}

/**
 * Jeitos de escrever o mesmo celular, só com DDD + número: com e sem o 55 do Brasil
 * e com e sem o 9 da frente (cadastros antigos às vezes não têm).
 */
export function chavesDoTelefone(telefone: string | null | undefined): string[] {
  let d = (telefone ?? "").replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length > 11 && d.startsWith("0")) d = d.replace(/^0+/, "");
  if (d.length === 11 && d[2] === "9") return [d, d.slice(0, 2) + d.slice(3)];
  if (d.length === 10) return [d, `${d.slice(0, 2)}9${d.slice(2)}`];
  return d.length >= 8 ? [d] : [];
}

export type ClienteDoOrcamento = { id: string; nome: string; telefone: string | null };

/** Procura entre os clientes alguém com o mesmo celular do pedido (o primeiro que bater). */
export function clientePeloTelefone<T extends ClienteDoOrcamento>(clientes: T[], telefone: string): T | null {
  const chaves = new Set(chavesDoTelefone(telefone));
  if (chaves.size === 0) return null;
  return clientes.find((c) => chavesDoTelefone(c.telefone).some((k) => chaves.has(k))) ?? null;
}
