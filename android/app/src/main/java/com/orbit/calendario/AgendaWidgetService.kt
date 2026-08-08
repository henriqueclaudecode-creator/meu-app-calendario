package com.orbit.calendario

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONArray
import org.json.JSONObject

/** Serviço que alimenta a lista do widget grátis "Agenda de Hoje". */
class AgendaWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return AgendaFactory(applicationContext)
    }
}

class AgendaFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {

    private var itens: JSONArray = JSONArray()

    override fun onCreate() {}

    override fun onDataSetChanged() {
        itens = try {
            val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
            val raw = prefs.getString("widget_agenda", null)
            if (raw != null) JSONObject(raw).optJSONArray("itens") ?: JSONArray() else JSONArray()
        } catch (e: Exception) {
            JSONArray()
        }
    }

    override fun onDestroy() {}

    override fun getCount(): Int = itens.length()

    override fun getViewAt(position: Int): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_agenda_item)
        val item = itens.optJSONObject(position) ?: return views

        views.setTextViewText(R.id.ag_hora, item.optString("hora", ""))
        views.setTextViewText(R.id.ag_titulo, item.optString("titulo", "Evento"))

        val sub = item.optString("sub", "")
        views.setTextViewText(R.id.ag_sub, sub)
        views.setViewVisibility(
            R.id.ag_sub,
            if (sub.isBlank()) android.view.View.GONE else android.view.View.VISIBLE
        )

        val cor = try {
            val hex = item.optString("cor", "")
            if (hex.isBlank()) null else Color.parseColor(hex)
        } catch (e: Exception) {
            null
        }
        if (cor != null) {
            views.setInt(R.id.ag_dot, "setColorFilter", cor)
            views.setInt(R.id.ag_icone, "setColorFilter", cor)
        }

        // Toque na linha abre o app (usa o template definido no provider).
        views.setOnClickFillInIntent(R.id.widget_root_item, Intent())
        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
}
