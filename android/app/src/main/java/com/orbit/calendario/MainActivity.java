package com.orbit.calendario;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registra o plugin local que atualiza os widgets da tela inicial.
        registerPlugin(WidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
