import Link from "next/link";
import { Check } from "lucide-react";
import { Topo } from "@/components/topo";
import { buscarAssinatura } from "@/lib/assinatura";
import { partesLocais } from "@/lib/agenda";
import { formatarData } from "@/lib/clientes";
import { precoMensal } from "@/lib/empresa";

const INCLUI = [
  "Agenda com linha do tempo e lembretes no iPhone",
  "Clientes com anamnese, termo assinado e fotos",
  "Financeiro com taxas, comissão e relatórios em PDF",
  "Estoque com aviso de itens acabando",
];

const data = (instante: string) => formatarData(partesLocais(instante).data);

export default async function AssinaturaPage() {
  const assinatura = await buscarAssinatura();

  return (
    <>
      <Topo titulo="Assinatura" voltar={assinatura?.situacao === "vencida" ? undefined : "/conta"} />
      <div className="flex flex-col gap-4">
        {assinatura?.situacao === "vencida" && (
          <div className="card flex flex-col gap-1 border-amber-500/40">
            <p className="font-semibold">Seu período grátis terminou</p>
            <p className="text-sm text-muted">
              Seus dados continuam guardados. Assine para voltar a usar a agenda, os clientes e o financeiro.
            </p>
          </div>
        )}
        {assinatura?.situacao === "teste" && (
          <p className="aviso-ok">
            Período grátis: {assinatura.dias === 1 ? "falta 1 dia" : `faltam ${assinatura.dias} dias`} (até{" "}
            {data(assinatura.ate)}).
          </p>
        )}
        {assinatura?.situacao === "ativa" && (
          <p className="aviso-ok">Assinatura ativa até {data(assinatura.ate)}.</p>
        )}

        <div className="card flex flex-col gap-4">
          <div>
            <p className="text-lg font-semibold">Ravenn mensal</p>
            <p className="mt-1">
              <span className="text-3xl font-bold">{precoMensal()}</span>
              <span className="text-muted"> por mês</span>
            </p>
            <p className="text-sm text-muted">Tudo do app, sem limite de clientes. Cancele quando quiser.</p>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {INCLUI.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-lavanda" />
                {item}
              </li>
            ))}
          </ul>
          {assinatura?.situacao !== "ativa" && (
            <>
              <button type="button" className="botao" disabled>
                Assinar — em breve
              </button>
              <p className="text-xs text-muted">
                A assinatura pelo app e pelo site abre em breve. Até lá, seu acesso continua liberado.
              </p>
            </>
          )}
        </div>

        {assinatura?.situacao === "vencida" && (
          <div className="card flex flex-col gap-2 text-sm">
            <p className="font-semibold">Seus dados são seus</p>
            <p className="text-muted">Mesmo sem assinar, você pode:</p>
            <Link href="/financeiro/relatorio" className="text-lavanda underline">
              Baixar o relatório financeiro
            </Link>
            <Link href="/conta" className="text-lavanda underline">
              Ver sua conta
            </Link>
            <Link href="/conta/excluir" className="text-lavanda underline">
              Excluir sua conta e todos os dados
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
