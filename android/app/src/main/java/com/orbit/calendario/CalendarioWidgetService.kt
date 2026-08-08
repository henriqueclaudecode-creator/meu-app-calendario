package com.orbit.calendario

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.view.View
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONArray
import org.json.JSONObject

/** Serviço que alimenta a grade (GridView) do widget de Calendário. */
class CalendarioWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return CalendarioFactory(applicationContext)
    }
}

class CalendarioFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {

    private var celulas: JSONArray = JSONArray()

    override fun onCreate() {}

    override fun onDataSetChanged() {
        celulas = try {
            val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
            val raw = prefs.getString("widget_calendario", null)
            if (raw != null) JSONObject(raw).optJSONArray("celulas") ?: JSONArray() else JSONArray()
        } catch (e: Exception) {
            JSONArray()
        }
    }

    override fun onDestroy() {}

    override fun getCount(): Int = celulas.length()

    override fun getViewAt(position: Int): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_cal_celula)
        val c = celulas.optJSONObject(position) ?: return views

        val noMes = c.optBoolean("noMes", true)
        val hoje = c.optBoolean("hoje", false)
        val dom = c.optBoolean("dom", false)

        views.setTextViewText(R.id.cel_num, c.optInt("dia", 0).toString())

        // Cor / destaque do número.
        when {
            hoje -> {
                views.setInt(R.id.cel_num, "setBackgroundResource", R.drawable.widget_today_circle)
                views.setTextColor(R.id.cel_num, Color.WHITE)
            }
            else -> {
                views.setInt(R.id.cel_num, "setBackgroundResource", 0)
                val cor = when {
                    !noMes -> corDe("orbit_text_muted")
                    dom -> Color.parseColor("#E5484D")
                    else -> corDe("orbit_text")
                }
                views.setTextColor(R.id.cel_num, cor)
            }
        }

        // Chips
        val chips = c.optJSONArray("chips") ?: JSONArray()
        aplicarChip(views, R.id.cel_chip0, chips.optJSONObject(0), noMes)
        aplicarChip(views, R.id.cel_chip1, chips.optJSONObject(1), noMes)

        val extra = c.optInt("extra", 0)
        if (extra > 0 && noMes) {
            views.setViewVisibility(R.id.cel_extra, View.VISIBLE)
            views.setTextViewText(R.id.cel_extra, "+$extra")
        } else {
            views.setViewVisibility(R.id.cel_extra, View.GONE)
        }

        return views
    }

    private fun aplicarChip(views: RemoteViews, id: Int, chip: JSONObject?, noMes: Boolean) {
        if (chip == null || !noMes) {
            views.setViewVisibility(id, View.GONE)
            return
        }
        views.setViewVisibility(id, View.VISIBLE)
        views.setTextViewText(id, chip.optString("t", ""))
        val cor = try {
            val hex = chip.optString("cor", "")
            if (hex.isBlank()) null else Color.parseColor(hex)
        } catch (e: Exception) {
            null
        }
        if (cor != null) views.setTextColor(id, cor)
    }

    private fun corDe(nome: String): Int {
        val id = context.resources.getIdentifier(nome, "color", context.packageName)
        return if (id != 0) context.resources.getColor(id, context.theme) else Color.GRAY
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
}
