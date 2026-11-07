// Foto da pessoa ou, sem foto, círculo com as iniciais (a cor é sempre a mesma para o mesmo nome).
const CORES = [
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-accent/20 text-lavanda",
  "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
];

function iniciais(nome: string): string {
  const partes = nome.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function corDoNome(nome: string): string {
  let soma = 0;
  for (const letra of nome) soma = (soma * 31 + letra.charCodeAt(0)) >>> 0;
  return CORES[soma % CORES.length];
}

export function Avatar({
  nome,
  foto,
  tamanho = "normal",
}: {
  nome: string;
  /** Link da foto; sem foto, mostra as iniciais. */
  foto?: string | null;
  tamanho?: "normal" | "grande" | "pagina";
}) {
  const medidas =
    tamanho === "pagina" ? "size-24 text-3xl" : tamanho === "grande" ? "size-14 text-lg" : "size-10 text-sm";
  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={foto} alt={`Foto de ${nome}`} className={`shrink-0 rounded-full object-cover ${medidas}`} />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${medidas} ${corDoNome(nome)}`}
    >
      {iniciais(nome)}
    </span>
  );
}
