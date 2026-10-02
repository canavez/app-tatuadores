// Texto padrão do termo de consentimento.
// Ao mudar o texto, troque a versão: termos já assinados guardam o texto antigo.
export const VERSAO_TERMO = "2026-10-02";

export type DadosTermo = {
  cliente: string;
  cpf: string | null;
  tatuagem: string;
  localCorpo: string | null;
  tatuador: string;
  responsavel: { nome: string; cpf: string } | null;
};

export function textoDoTermo(d: DadosTermo): string {
  const identificacao = d.cpf ? `${d.cliente}, CPF ${d.cpf}` : d.cliente;
  const procedimento = d.localCorpo ? `${d.tatuagem}, no local ${d.localCorpo}` : d.tatuagem;

  const paragrafos = [
    `Eu, ${identificacao}, autorizo ${d.tatuador} a realizar em mim o procedimento de tatuagem descrito como: ${procedimento}.`,
    d.responsavel
      ? `Por ser menor de 18 anos, este termo é autorizado e assinado também pelo(a) meu(minha) responsável legal, ${d.responsavel.nome}, CPF ${d.responsavel.cpf}, que se declara ciente de todas as condições abaixo.`
      : "Declaro ter 18 anos ou mais.",
    "Declaro que as informações de saúde que prestei (ficha de anamnese) são verdadeiras e completas, e que a omissão de qualquer informação é de minha inteira responsabilidade.",
    "Declaro não estar sob efeito de álcool ou outras substâncias que alterem meu estado de consciência.",
    "Fui informado(a) de que a tatuagem é permanente e de que sua remoção exige procedimentos específicos, que podem não apagá-la por completo.",
    "Fui informado(a) dos riscos do procedimento, como dor, inchaço, vermelhidão, sangramento leve, reação alérgica aos pigmentos, infecção quando os cuidados não são seguidos e formação de queloide em pessoas com essa tendência.",
    "Conferi e aprovei o desenho, o tamanho, as cores e o local da tatuagem antes do início do procedimento.",
    "Recebi as orientações de cuidados pós-tatuagem e me comprometo a segui-las. Entendo que o resultado final depende também da minha cicatrização e desses cuidados.",
    "Autorizo a coleta e o armazenamento dos meus dados pessoais e de saúde exclusivamente para meu atendimento, para a segurança do procedimento e para o cumprimento de obrigações sanitárias, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Posso solicitar acesso, correção ou exclusão dos meus dados, respeitados os prazos de guarda exigidos por lei.",
  ];
  return paragrafos.join("\n\n");
}

export const TEXTO_IMAGEM =
  "Autorizo o uso de fotos e vídeos da minha tatuagem, sem mostrar meu rosto, no portfólio e nas redes sociais do(a) tatuador(a).";
