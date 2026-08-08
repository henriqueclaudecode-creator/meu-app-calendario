package com.orbit.calendario

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Plugin local que a camada web chama (WidgetBridge.refresh) logo após publicar
 * os dados, para os widgets se atualizarem na hora — sem esperar o ciclo do
 * sistema. Atualiza todos os widgets do Orbit.
 */
@CapacitorPlugin(name = "WidgetBridge")
class WidgetPlugin : Plugin() {

    @PluginMethod
    fun refresh(call: PluginCall) {
        val ctx = context.applicationContext
        try {
            ProximoEventoWidget.atualizarTodos(ctx)
            ContagemWidget.atualizarTodos(ctx)
            CalendarioWidget.atualizarTodos(ctx)
            AgendaWidget.atualizarTodos(ctx)
        } catch (e: Exception) {
            // Nunca deixa a falha de atualização quebrar o app.
        }
        call.resolve()
    }
}
