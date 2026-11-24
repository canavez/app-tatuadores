package me.ravenn.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins do próprio Ravenn (os de pacotes npm o Capacitor registra sozinho).
        registerPlugin(ImpressaoPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
