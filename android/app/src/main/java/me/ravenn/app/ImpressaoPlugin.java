package me.ravenn.app;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * "Imprimir / salvar PDF" no app de Android. O window.print() não faz nada dentro do app
 * (WebView), então a página chama este plugin, que abre a tela de impressão do Android
 * com a página atual (lá dá para escolher "Salvar como PDF").
 */
@CapacitorPlugin(name = "Impressao")
public class ImpressaoPlugin extends Plugin {

    @PluginMethod
    public void imprimir(PluginCall call) {
        String titulo = call.getString("titulo", "Ravenn");
        getActivity().runOnUiThread(() -> {
            try {
                PrintManager impressao = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                PrintDocumentAdapter documento = getBridge().getWebView().createPrintDocumentAdapter(titulo);
                impressao.print(titulo, documento, new PrintAttributes.Builder().build());
                call.resolve();
            } catch (Exception erro) {
                call.reject("Não foi possível abrir a impressão.", erro);
            }
        });
    }
}
