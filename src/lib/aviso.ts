import { cookies } from "next/headers";
import { COOKIE_AVISO, type Aviso } from "./avisos";

/**
 * Deixa um aviso ("Sessão salva") para a próxima tela mostrar no balão que sobe de baixo.
 * Use numa server action, antes do redirect. O cookie vive poucos segundos e o app
 * apaga assim que mostra.
 */
export async function avisar(aviso: Aviso) {
  (await cookies()).set(COOKIE_AVISO, aviso, { path: "/", maxAge: 20, sameSite: "lax" });
}
