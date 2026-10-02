// Condições de saúde perguntadas na anamnese (marque o que se aplica).
export const CONDICOES = [
  { campo: "diabetes", rotulo: "Diabetes" },
  { campo: "hipertensao", rotulo: "Pressão alta" },
  { campo: "cardiaco", rotulo: "Problema cardíaco" },
  { campo: "coagulacao", rotulo: "Hemofilia / problema de coagulação" },
  { campo: "epilepsia", rotulo: "Epilepsia / convulsões" },
  { campo: "desmaios", rotulo: "Desmaios / pressão baixa" },
  { campo: "doenca_infecciosa", rotulo: "Doença infectocontagiosa (hepatite, HIV etc.)" },
  { campo: "problema_pele", rotulo: "Problema de pele (psoríase, dermatite etc.)" },
  { campo: "queloide", rotulo: "Tendência a queloide" },
  { campo: "gestante", rotulo: "Gestante ou amamentando" },
  { campo: "anticoagulante", rotulo: "Usa anticoagulante (AAS, varfarina etc.)" },
  { campo: "isotretinoina", rotulo: "Usa ou usou Roacutan nos últimos 6 meses" },
] as const;

export const TEXTOS = [
  { campo: "alergias", rotulo: "Alergias", dica: "Ex.: látex, lidocaína, algum pigmento" },
  { campo: "medicamentos", rotulo: "Medicamentos em uso", dica: "Nome e para quê" },
  { campo: "outras_condicoes", rotulo: "Outras condições / observações de saúde", dica: "" },
] as const;

type CampoCondicao = (typeof CONDICOES)[number]["campo"];
type CampoTexto = (typeof TEXTOS)[number]["campo"];

export type Anamnese = Record<CampoCondicao, boolean> &
  Record<CampoTexto, string | null> & { atualizado_em: string };

/** Lista de pontos de atenção para mostrar em destaque. */
export function alertas(anamnese: Anamnese): string[] {
  const lista: string[] = CONDICOES.filter((c) => anamnese[c.campo]).map((c) => c.rotulo);
  if (anamnese.alergias) lista.push(`Alergia: ${anamnese.alergias}`);
  if (anamnese.medicamentos) lista.push(`Medicamentos: ${anamnese.medicamentos}`);
  if (anamnese.outras_condicoes) lista.push(anamnese.outras_condicoes);
  return lista;
}
