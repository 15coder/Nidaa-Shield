package expo.modules.nidaavpn

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.widget.RemoteViews

/**
 * Large status widget. Shows session name, uptime, blocked count and a
 * prominent power-toggle button. Tapping the body opens the app; the power
 * button toggles the VPN.
 */
class NidaaStatusWidgetProvider : AppWidgetProvider() {

  companion object {
    const val ACTION_TOGGLE = "expo.modules.nidaavpn.WIDGET_STATUS_TOGGLE"
    const val ACTION_OPEN = "expo.modules.nidaavpn.WIDGET_STATUS_OPEN"

    fun updateAll(context: Context) {
      try {
        val mgr = AppWidgetManager.getInstance(context) ?: return
        val ids = mgr.getAppWidgetIds(
          ComponentName(context, NidaaStatusWidgetProvider::class.java)
        )
        for (id in ids) renderOne(context, mgr, id)
      } catch (_: Throwable) {}
    }

    private fun renderOne(context: Context, mgr: AppWidgetManager, widgetId: Int) {
      val views = RemoteViews(context.packageName, R.layout.nidaa_status_widget_layout)
      val running = VpnState.isRunning
      val name = VpnState.sessionName ?: "نداء شايلد"

      views.setTextViewText(R.id.status_app_name, "نداء شايلد")
      views.setTextViewText(
        R.id.status_state_text,
        if (running) "الحماية مفعّلة" else "الحماية متوقفة"
      )
      views.setTextViewText(
        R.id.status_session_name,
        if (running) name else "اضغط للبدء"
      )
      views.setInt(
        R.id.status_indicator, "setBackgroundResource",
        if (running) R.drawable.nidaa_dot_active
        else R.drawable.nidaa_dot_inactive
      )
      views.setInt(
        R.id.status_power_btn, "setBackgroundResource",
        if (running) R.drawable.nidaa_power_on
        else R.drawable.nidaa_power_off
      )
      views.setTextViewText(
        R.id.status_power_label,
        if (running) "إيقاف" else "تشغيل"
      )

      // Stats row
      val total = VpnState.totalQueries.get()
      val blocked = VpnState.blockedQueries.get()
      val uptimeS = (VpnState.uptimeMs() / 1000L)
      views.setTextViewText(R.id.status_stat_blocked, blocked.toString())
      views.setTextViewText(R.id.status_stat_total, total.toString())
      views.setTextViewText(R.id.status_stat_uptime, formatUptime(uptimeS))

      val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

      val toggleIntent = Intent(context, NidaaStatusWidgetProvider::class.java)
        .apply { action = ACTION_TOGGLE }
      views.setOnClickPendingIntent(
        R.id.status_power_btn,
        PendingIntent.getBroadcast(context, 0, toggleIntent, flags)
      )

      // Tap header / body to open the app
      val openIntent = context.packageManager
        .getLaunchIntentForPackage(context.packageName)
      if (openIntent != null) {
        openIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        val openPi = PendingIntent.getActivity(context, 1, openIntent, flags)
        views.setOnClickPendingIntent(R.id.status_open_area, openPi)
      }

      mgr.updateAppWidget(widgetId, views)
    }

    private fun formatUptime(s: Long): String {
      if (s <= 0) return "0د"
      val h = s / 3600
      val m = (s % 3600) / 60
      return when {
        h > 0 -> "${h}س ${m}د"
        m > 0 -> "${m}د"
        else -> "${s}ث"
      }
    }
  }

  override fun onUpdate(
    context: Context,
    mgr: AppWidgetManager,
    widgetIds: IntArray,
  ) {
    for (id in widgetIds) renderOne(context, mgr, id)
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    when (intent.action) {
      ACTION_TOGGLE -> handleToggle(context)
      ACTION_OPEN -> openApp(context)
    }
  }

  private fun handleToggle(context: Context) {
    if (VpnState.isRunning) {
      val stop = Intent(context, NidaaVpnService::class.java).apply {
        action = NidaaVpnService.ACTION_STOP
      }
      try { context.startService(stop) } catch (_: Throwable) {}
      updateAll(context)
      return
    }

    val prep = try { VpnService.prepare(context) } catch (_: Throwable) { null }
    if (prep != null) { openApp(context); return }
    val cfg = VpnPrefs.loadLast(context)
    if (cfg == null) { openApp(context); return }

    val start = Intent(context, NidaaVpnService::class.java).apply {
      action = NidaaVpnService.ACTION_START
      putExtra(NidaaVpnService.EXTRA_PRIMARY, cfg.primary)
      putExtra(NidaaVpnService.EXTRA_SECONDARY, cfg.secondary)
      putExtra(NidaaVpnService.EXTRA_USE_DOH, cfg.useDoH)
      putExtra(NidaaVpnService.EXTRA_NAME, cfg.name)
      putExtra(NidaaVpnService.EXTRA_MODE_ID, cfg.modeId)
      putExtra(NidaaVpnService.EXTRA_BLOCKLIST, cfg.blocklist.toTypedArray())
      putExtra(NidaaVpnService.EXTRA_WHITELIST, cfg.whitelist.toTypedArray())
      putExtra(NidaaVpnService.EXTRA_EXCLUDED, cfg.excluded.toTypedArray())
    }
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(start)
      } else {
        context.startService(start)
      }
    } catch (_: Throwable) {}
    updateAll(context)
  }

  private fun openApp(context: Context) {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: return
    launch.flags = Intent.FLAG_ACTIVITY_NEW_TASK
    try { context.startActivity(launch) } catch (_: Throwable) {}
  }
}
