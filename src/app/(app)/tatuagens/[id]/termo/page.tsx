import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { calcularIdade, formatarData } from "@/lib/clientes";
import { partesLocais } from "@/lib/agenda";
import { TEXTO_IMAGEM } from "@/lib/termo";
import { Topo } from "@/components/topo";
import { BotaoExcluir } from "@/components/botao-excluir";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { ResumoAnamnese } from "@/components/resumo-anamnese";
import { buscarAnamnese } from "../../../clientes/[id]/buscar-cliente";
import { excluirTermo } from "./actions";
import { buscarTatuagemETermo, destinoSeguro } from "./dados";
import { TermoForm } from "./termo-form";

export default async function TermoPage({ params, searchParams }: PageProps<"/tatuagens/[id]/termo">) {
  const { id } = await params;
  const de = destinoSeguro((await searchParams).de);
  const { tatuagem, termo, nomeTatuador, tatuadorSemNome } = await buscarTatuagemETermo(id);
  const { cliente } = tatuagem;
  const voltar = de ?? `/clientes/${cliente.id}`;

  if (termo) {
    const quando = partesLocais(termo.assinado_em);
    return (
      <>
        <Topo titulo="Termo assinado" subtitulo={tatuagem.descricao} voltar={voltar} />
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
            <CircleCheck className="size-5" />
            Assinado em {formatarData(quando.data)} às {quando.hora}
          </p>

          <article className="card text-sm leading-relaxed print:border-0 print:p-0">
            <h2 className="mb-3 font-semibold">Termo de consentimento para tatuagem</h2>
            {termo.texto.split("\n\n").map((p, i) => (
              <p key={i} className="mb-3">
                {p}
              </p>
            ))}
            <p className="mb-3">
              {termo.autoriza_imagem ? "☑" : "☐"} {TEXTO_IMAGEM}
            </p>

            <div className="mt-6 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={termo.assinatura}
                alt={`Assinatura de ${termo.nome_assinante}`}
                className="h-32 w-full max-w-md rounded-lg bg-white object-contain"
              />
              <div className="w-full max-w-md border-t border-foreground pt-1 text-center text-xs">
                {termo.nome_assinante}
                {termo.cpf_assinante && ` · CPF ${termo.cpf_assinante}`}
                {termo.responsavel_nome &&
                  ` · Responsável: ${termo.responsavel_nome}, CPF ${termo.responsavel_cpf}`}
              </div>
              <p className="mt-2 text-xs text-muted">
                {formatarData(quando.data)} às {quando.hora} · versão {termo.versao}
              </p>
            </div>
          </article>

          <div className="flex flex-col gap-2 print:hidden sm:flex-row">
            <BotaoImprimir />
          </div>

          <div className="mt-4 flex justify-center print:hidden">
            <BotaoExcluir
              acao={excluirTermo.bind(null, tatuagem.id, de)}
              rotulo="Excluir termo"
              confirmacao="Excluir este termo assinado? Só faça isso se ele foi preenchido errado; depois será preciso assinar de novo."
            />
          </div>
        </div>
      </>
    );
  }

  const idade = calcularIdade(cliente.data_nascimento);
  const anamnese = await buscarAnamnese(cliente.id);

  return (
    <>
      <Topo titulo="Termo de consentimento" subtitulo={tatuagem.descricao} voltar={voltar} />
      <div className="flex flex-col gap-4">
        {tatuadorSemNome && (
          <p className="aviso-erro">
            Seu nome ainda não está cadastrado, então o termo vai mostrar seu e-mail.{" "}
            <Link href="/conta" className="font-medium underline">
              Cadastrar meu nome
            </Link>
          </p>
        )}
        <p className="text-sm text-muted">
          Entregue o celular ao cliente para conferir os dados, ler o termo e assinar.
        </p>
        <ResumoAnamnese clienteId={cliente.id} anamnese={anamnese} />
        <TermoForm
          tatuagemId={tatuagem.id}
          de={de}
          tatuagem={tatuagem.descricao}
          localCorpo={tatuagem.local_corpo}
          tatuador={nomeTatuador}
          clienteNome={cliente.nome}
          clienteCpf={cliente.cpf}
          menor={idade !== null && idade < 18}
        />
      </div>
    </>
  );
}
