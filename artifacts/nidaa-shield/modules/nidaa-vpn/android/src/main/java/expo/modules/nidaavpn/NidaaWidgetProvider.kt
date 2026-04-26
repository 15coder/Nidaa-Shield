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
 * Home-screen widget showing protection status with a one-tap toggle.
 * Updates whenever the VPN service starts/stops via [updateAll].
 */
class NidaaWidgetProvider : AppWidgetProvider() {

  companion object {
    const val ACTION_TOGGLE = "expo.modules.nidaavpn.WIDGET_TOGGLE"

    fun updateAll(context: Context) {
      try {
        val mgr = AppWidgetManager.getInstance(context) ?: return
        val ids = mgr.getAppWidgetIds(
          ComponentName(context, NidaaWidgetProvider::class.java)
        )
        for (id in ids) renderOne(context, mgr, id)
      } catch (_: Throwable) {}
    }

    private fun renderOne(context: Context, mgr: AppWidgetManager, widgetId: Int) {
      val views = RemoteViews(context.packageName, R.layout.nidaa_widget_layout)
      val running = VpnState.isRunning
      val name = VpnState.sessionName ?: "نداء شايلد"

      views.setTextViewText(R.id.widget_title, "نداء شايلد")
      views.setTextViewText(
        R.id.widget_status,
        if (running) "الحماية مفعّلة" else "الحماية متوقفة"
      )
      views.setTextViewText(
        R.id.widget_session,
        if (running) name else "اضغط للتفعيل"
      )
      views.setInt(
        R.id.widget_indicator, "setBackgroundColor",
        if (running) 0xFF1B7A4B.toInt() else 0xFF8B95A1.toInt()
      )

      val toggleIntent = Intent(context, NidaaWidgetProvider::class.java).apply {
        action = ACTION_TOGGLE
      }
      val piFlags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      val togglePi = PendingIntent.getBroadcast(context, 0, toggleIntent, piFlags)
      views.setOnClickPendingIntent(R.id.widget_root, togglePi)

      mgr.updateAppWidget(widgetId, views)
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
    if (intent.action == ACTION_TOGGLE) {
      handleToggle(context)
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

    // OFF -> try to start
    val prep = try { VpnService.prepare(context) } catch (_: Throwable) { null }
    if (prep != null) {
      // Permission required — open the app
      openApp(context)
      return
    }
    val cfg = VpnPrefs.loadLast(context)
    if (cfg == null) {
      openApp(context)
      return
    }
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
