export type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  instagram: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  observacoes: string | null;
  /** Caminho da foto no espaço "fotos" (null = sem foto). */
  foto: string | null;
  criado_em: string;
};

export function calcularIdade(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null;
  const [ano, mes, dia] = dataNascimento.split("-").map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  const aindaNaoFezAniversario =
    hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia);
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function linkWhatsApp(telefone: string): string {
  let digitos = telefone.replace(/\D/g, "");
  if (digitos.length <= 11) digitos = `55${digitos}`;
  return `https://wa.me/${digitos}`;
}
