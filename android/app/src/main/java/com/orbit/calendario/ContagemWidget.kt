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
 * Widget "Contagem Regressiva" do Orbit. Mostra até dois eventos futuros
 * (favoritos, ou os próximos) como "Prova em 45 dias". Lê o JSON publicado pelo
 * app em Preferences("CapacitorStorage") na chave "widget_contagem".
 */
class ContagemWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) atualizar(context, appWidgetManager, id)
    }

    private fun atualizar(context: Context, manager: AppWidgetManager, widgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.widget_contagem)
        val json = lerDado(context)
        val itens = json?.optJSONArray("itens")

        if (itens == null || itens.length() == 0) {
            views.setViewVisibility(R.id.box_cards, View.GONE)
            views.setViewVisibility(R.id.tv_empty, View.VISIBLE)
        } else {
            views.setViewVisibility(R.id.box_cards, View.VISIBLE)
            views.setViewVisibility(R.id.tv_empty, View.GONE)

            val c0 = itens.optJSONObject(0)
            preencher(views, c0, R.id.c0_titulo, R.id.c0_num, R.id.c0_unidade, R.id.c0_data, R.id.c0_icone)

            if (itens.length() > 1) {
                views.setViewVisibility(R.id.box_card1, View.VISIBLE)
                val c1 = itens.optJSONObject(1)
                preencher(views, c1, R.id.c1_titulo, R.id.c1_num, R.id.c1_unidade, R.id.c1_data, R.id.c1_icone)
            } else {
                views.setViewVisibility(R.id.box_card1, View.GONE)
            }
        }

        views.setViewVisibility(
            R.id.tv_premium,
            if (json != null && json.optBoolean("premium", false)) View.VISIBLE else View.GONE
        )

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

    private fun preencher(
        views: RemoteViews, item: JSONObject?,
        idTitulo: Int, idNum: Int, idUnidade: Int, idData: Int, idIcone: Int
    ) {
        if (item == null) return
        views.setTextViewText(idTitulo, "${item.optString("titulo", "Evento")} em")
        views.setTextViewText(idNum, item.optInt("dias", 0).toString())
        views.setTextViewText(idUnidade, item.optString("unidade", "dias"))
        views.setTextViewText(idData, item.optString("data", ""))

        val cor = parseCor(item.optString("cor", ""))
        if (cor != null) {
            views.setTextColor(idNum, cor)
            views.setTextColor(idUnidade, cor)
            views.setInt(idIcone, "setColorFilter", cor)
        }
    }

    private fun lerDado(context: Context): JSONObject? {
        return try {
            val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
            val raw = prefs.getString("widget_contagem", null) ?: return null
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
        fun atualizarTodos(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(
                android.content.ComponentName(context, ContagemWidget::class.java)
            )
            val intent = Intent(context, ContagemWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            context.sendBroadcast(intent)
        }
    }
}
