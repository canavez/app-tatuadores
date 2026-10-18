export const CATEGORIAS_ESTOQUE = {
  cartuchos: "Cartuchos",
  agulhas: "Agulhas",
  biqueiras: "Biqueiras",
  tintas: "Tintas",
  luvas: "Luvas",
  descartaveis: "Descartáveis",
  decalque: "Decalque",
  higiene: "Higiene e cuidados",
  outros: "Outros",
} as const;

export type CategoriaEstoque = keyof typeof CATEGORIAS_ESTOQUE;

export function ehCategoriaEstoque(valor: unknown): valor is CategoriaEstoque {
  return typeof valor === "string" && valor in CATEGORIAS_ESTOQUE;
}

export type ItemEstoque = {
  id: string;
  nome: string;
  categoria: CategoriaEstoque;
  quantidade: number;
  unidade: string;
  estoque_minimo: number;
};

/** Acabando: tem estoque mínimo definido e a quantidade chegou nele. */
export function acabando(item: Pick<ItemEstoque, "quantidade" | "estoque_minimo">): boolean {
  return item.estoque_minimo > 0 && item.quantidade <= item.estoque_minimo;
}

const tamanhos = (prefixo: string, sufixo: string, numeros: number[]) =>
  numeros.map((n) => `${prefixo} ${n}${sufixo}`);

/** Itens prontos para o tatuador escolher os que usa. */
export const CATALOGO: { categoria: CategoriaEstoque; itens: string[] }[] = [
  {
    categoria: "cartuchos",
    itens: [
      ...tamanhos("Cartucho", "RL", [1, 3, 5, 7, 9, 11, 14]),
      ...tamanhos("Cartucho", "RS", [5, 7, 9, 11, 14]),
      ...tamanhos("Cartucho", "M1 (magnum)", [7, 9, 11, 13, 15]),
      ...tamanhos("Cartucho", "RM (magnum curva)", [9, 11, 13, 15, 17, 23]),
      ...tamanhos("Cartucho", "F (flat)", [5, 7, 9]),
    ],
  },
  {
    categoria: "agulhas",
    itens: [
      ...tamanhos("Agulha", "RL", [3, 5, 7, 9, 11, 14]),
      ...tamanhos("Agulha", "RS", [5, 7, 9, 11, 14]),
      ...tamanhos("Agulha", "MG (magnum)", [7, 9, 11, 13, 15]),
      ...tamanhos("Agulha", "RM (magnum curva)", [9, 11, 13, 15]),
    ],
  },
  {
    categoria: "biqueiras",
    itens: [
      ...tamanhos("Biqueira", "RL", [3, 5, 7, 9, 11, 14]),
      ...tamanhos("Biqueira", "RS", [5, 7, 9, 11, 14]),
      ...tamanhos("Biqueira", "MG", [7, 9, 11, 13, 15]),
      "Grip descartável",
    ],
  },
  {
    categoria: "tintas",
    itens: [
      "Tinta preta (linha)",
      "Tinta preta (sombra)",
      "Tinta branca",
      "Mix / diluente para sombra",
      "Água destilada",
    ],
  },
  {
    categoria: "luvas",
    itens: ["Luva nitrílica PP", "Luva nitrílica P", "Luva nitrílica M", "Luva nitrílica G", "Luva nitrílica XG"],
  },
  {
    categoria: "descartaveis",
    itens: [
      "Máscara descartável",
      "Batoque P",
      "Batoque M",
      "Batoque G",
      "Capa para máquina",
      "Capa para clip cord",
      "Filme PVC",
      "Papel toalha",
      "Campo / babador descartável",
      "Lâmina de barbear",
      "Espátula descartável",
      "Copo descartável",
      "Elástico para máquina",
    ],
  },
  {
    categoria: "decalque",
    itens: ["Papel hectográfico", "Gel / fixador de decalque", "Caneta para pele"],
  },
  {
    categoria: "higiene",
    itens: [
      "Álcool 70%",
      "Sabonete antisséptico",
      "Vaselina",
      "Pomada para tatuagem",
      "Película protetora (filme cicatrizante)",
      "Spray de limpeza (green soap)",
    ],
  },
];

/** Categorias que podem ser registradas como "materiais usados" numa sessão. */
export const CATEGORIAS_DA_SESSAO: CategoriaEstoque[] = ["cartuchos", "agulhas", "biqueiras"];
