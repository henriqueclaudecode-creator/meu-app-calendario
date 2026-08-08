package com.orbit.calendario

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject

/**
 * Widget GRÁTIS "Agenda de Hoje" do Orbit. Cabeçalho com a data, a lista de
 * eventos do dia (alimentada pelo AgendaWidgetService) e o rodapé com o total.
 * Sem trava premium: qualquer usuário pode usar.
 */
class AgendaWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_agenda)
            val dado = lerDado(context)

            views.setTextViewText(R.id.ag_data, dado?.optString("data", "") ?: "")
            views.setTextViewText(R.id.ag_rodape, dado?.optString("rodape", "") ?: "")

            val total = dado?.optJSONArray("itens")?.length() ?: 0
            if (total == 0) {
                views.setViewVisibility(R.id.ag_lista, View.GONE)
                views.setViewVisibility(R.id.ag_empty, View.VISIBLE)
            } else {
                views.setViewVisibility(R.id.ag_lista, View.VISIBLE)
                views.setViewVisibility(R.id.ag_empty, View.GONE)
            }

            val svc = Intent(context, AgendaWidgetService::class.java)
            views.setRemoteAdapter(R.id.ag_lista, svc)

            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launch != null) {
                val pending = PendingIntent.getActivity(
                    context, 0, launch,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setPendingIntentTemplate(R.id.ag_lista, pending)
                views.setOnClickPendingIntent(R.id.widget_root, pending)
            }

            appWidgetManager.updateAppWidget(id, views)
            appWidgetManager.notifyAppWidgetViewDataChanged(id, R.id.ag_lista)
        }
    }

    private fun lerDado(context: Context): JSONObject? {
        return try {
            val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
            val raw = prefs.getString("widget_agenda", null) ?: return null
            JSONObject(raw)
        } catch (e: Exception) {
            null
        }
    }

    companion object {
        fun atualizarTodos(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, AgendaWidget::class.java))
            val intent = Intent(context, AgendaWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            context.sendBroadcast(intent)
        }
    }
}
