package com.orbit.calendario

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject

/**
 * Widget "Próximo Evento" do Orbit.
 *
 * Não tem acesso ao IndexedDB do app web; a ponte de dados é o Capacitor
 * Preferences, que grava em SharedPreferences("CapacitorStorage"). O app web
 * publica um JSON na chave "widget_proximo" (ver src/lib/widget.js) e este
 * provider lê e desenha. Quando não há dado, mostra um estado vazio elegante.
 */
class ProximoEventoWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            atualizar(context, appWidgetManager, id)
        }
    }

    private fun atualizar(context: Context, manager: AppWidgetManager, widgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.widget_proximo_evento)

        val json = lerDado(context)
        val temEvento = json != null && !json.optBoolean("vazio", false)

        if (temEvento) {
            views.setViewVisibility(R.id.box_conteudo, View.VISIBLE)
            views.setViewVisibility(R.id.tv_empty, View.GONE)

            val hora = json!!.optString("hora", "")
            views.setViewVisibility(R.id.tv_hora, if (hora.isEmpty()) View.GONE else View.VISIBLE)
            views.setTextViewText(R.id.tv_hora, hora)
            views.setTextViewText(R.id.tv_titulo, json.optString("titulo", "Evento"))

            val local = json.optString("local", "")
            views.setViewVisibility(R.id.box_local, if (local.isEmpty()) View.GONE else View.VISIBLE)
            views.setTextViewText(R.id.tv_local, local)

            views.setTextViewText(R.id.tv_contagem, json.optString("contagem", ""))
            views.setTextViewText(R.id.tv_data, json.optString("data", ""))

            // Cor da categoria — discreta, aplicada ao ícone e ao pontinho.
            val cor = parseCor(json.optString("cor", ""))
            if (cor != null) {
                views.setInt(R.id.ic_categoria, "setColorFilter", cor)
                views.setInt(R.id.dot_local, "setColorFilter", cor)
            }

            // Selo Premium discreto no rodapé (curiosidade, não bloqueio).
            views.setViewVisibility(
                R.id.tv_premium,
                if (json.optBoolean("premium", false)) View.VISIBLE else View.GONE
            )
        } else {
            views.setViewVisibility(R.id.box_conteudo, View.GONE)
            views.setViewVisibility(R.id.tv_empty, View.VISIBLE)
            views.setViewVisibility(R.id.tv_premium, View.GONE)
        }

        // Tocar no widget abre o app.
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (launch != null) {
            val pending = PendingIntent.getActivity(
                context, 0, launch,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pending)
        }

        manager.updateAppWidget(widgetId, views)
    }

    /** Lê o JSON publicado pelo app via Capacitor Preferences. */
    private fun lerDado(context: Context): JSONObject? {
        return try {
            val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
            val raw = prefs.getString("widget_proximo", null) ?: return null
            JSONObject(raw)
        } catch (e: Exception) {
            null
        }
    }

    private fun parseCor(hex: String): Int? {
        return try {
            if (hex.isBlank()) null else Color.parseColor(hex)
        } catch (e: Exception) {
            null
        }
    }

    companion object {
        /** Força a atualização de todos os widgets. Chamado quando os dados mudam. */
        fun atualizarTodos(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(
                android.content.ComponentName(context, ProximoEventoWidget::class.java)
            )
            val intent = Intent(context, ProximoEventoWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            context.sendBroadcast(intent)
        }
    }
}
