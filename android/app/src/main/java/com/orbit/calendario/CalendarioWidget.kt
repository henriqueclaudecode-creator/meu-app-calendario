package com.orbit.calendario

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject

/**
 * Widget "Calendário" do Orbit (4x4). Cabeçalho com o mês + grade alimentada pelo
 * CalendarioWidgetService, que lê os dados publicados pelo app.
 */
class CalendarioWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_calendario)

            // Título do mês + selo premium.
            val dado = lerDado(context)
            views.setTextViewText(R.id.cal_mes, dado?.optString("mes", "") ?: "")
            views.setViewVisibility(
                R.id.tv_premium,
                if (dado != null && dado.optBoolean("premium", false)) android.view.View.VISIBLE else android.view.View.GONE
            )

            // Liga a grade ao serviço da coleção.
            val svc = Intent(context, CalendarioWidgetService::class.java)
            views.setRemoteAdapter(R.id.cal_grade, svc)

            // Tocar em qualquer célula abre o app.
            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launch != null) {
                val pending = PendingIntent.getActivity(
                    context, 0, launch,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setPendingIntentTemplate(R.id.cal_grade, pending)
                views.setOnClickPendingIntent(R.id.cal_mes, pending)
            }

            appWidgetManager.updateAppWidget(id, views)
            appWidgetManager.notifyAppWidgetViewDataChanged(id, R.id.cal_grade)
        }
    }

    private fun lerDado(context: Context): JSONObject? {
        return try {
            val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
            val raw = prefs.getString("widget_calendario", null) ?: return null
            JSONObject(raw)
        } catch (e: Exception) {
            null
        }
    }

    companion object {
        fun atualizarTodos(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, CalendarioWidget::class.java))
            val intent = Intent(context, CalendarioWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            context.sendBroadcast(intent)
        }
    }
}
