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
 * 4-mode home-screen widget. Each mode is its own button; tapping one starts
 * that mode's protection immediately (or stops it if already active).
 */
class NidaaModesWidgetProvider : AppWidgetProvider() {

  companion object {
    const val ACTION_SMART = "expo.modules.nidaavpn.WIDGET_MODE_SMART"
    const val ACTION_GAMING = "expo.modules.nidaavpn.WIDGET_MODE_GAMING"
    const val ACTION_FAMILY = "expo.modules.nidaavpn.WIDGET_MODE_FAMILY"
    const val ACTION_MILITARY = "expo.modules.nidaavpn.WIDGET_MODE_MILITARY"

    fun updateAll(context: Context) {
      try {
        val mgr = AppWidgetManager.getInstance(context) ?: return
        val ids = mgr.getAppWidgetIds(
          ComponentName(context, NidaaModesWidgetProvider::class.java)
        )
        for (id in ids) renderOne(context, mgr, id)
      } catch (_: Throwable) {}
    }

    private fun renderOne(context: Context, mgr: AppWidgetManager, widgetId: Int) {
      val views = RemoteViews(context.packageName, R.layout.nidaa_modes_widget_layout)
      val active = if (VpnState.isRunning) VpnState.modeId else null

      // Header status
      views.setTextViewText(
        R.id.modes_status,
        if (VpnState.isRunning) "الحماية مفعّلة • ${VpnState.sessionName ?: ""}"
        else "اختر وضع الحماية"
      )
      views.setInt(
        R.id.modes_status_dot, "setBackgroundResource",
        if (VpnState.isRunning) R.drawable.nidaa_dot_active
        else R.drawable.nidaa_dot_inactive
      )

      // Each tile reflects active state
      bindTile(
        context, views, R.id.btn_smart, R.id.smart_label, R.id.smart_icon_bg,
        active == "smart", "الذكي", ACTION_SMART
      )
      bindTile(
        context, views, R.id.btn_gaming, R.id.gaming_label, R.id.gaming_icon_bg,
        active == "gaming", "الألعاب", ACTION_GAMING
      )
      bindTile(
        context, views, R.id.btn_family, R.id.family_label, R.id.family_icon_bg,
        active == "family", "العائلة", ACTION_FAMILY
      )
      bindTile(
        context, views, R.id.btn_military, R.id.military_label, R.id.military_icon_bg,
        active == "military", "العسكرية", ACTION_MILITARY
      )

      mgr.updateAppWidget(widgetId, views)
    }

    private fun bindTile(
      context: Context,
      views: RemoteViews,
      btnId: Int,
      labelId: Int,
      iconBgId: Int,
      active: Boolean,
      label: String,
      action: String,
    ) {
      views.setTextViewText(labelId, label)
      views.setInt(
        iconBgId, "setBackgroundResource",
        if (active) R.drawable.nidaa_mode_chip_active
        else R.drawable.nidaa_mode_chip_inactive
      )
      val intent = Intent(context, NidaaModesWidgetProvider::class.java).apply {
        this.action = action
      }
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      val pi = PendingIntent.getBroadcast(
        context, action.hashCode(), intent, flags
      )
      views.setOnClickPendingIntent(btnId, pi)
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
    val mode = when (intent.action) {
      ACTION_SMART -> "smart"
      ACTION_GAMING -> "gaming"
      ACTION_FAMILY -> "family"
      ACTION_MILITARY -> "military"
      else -> null
    } ?: return
    handleModeTap(context, mode)
  }

  private fun handleModeTap(context: Context, mode: String) {
    // Same mode + running => stop
    if (VpnState.isRunning && VpnState.modeId == mode) {
      val stop = Intent(context, NidaaVpnService::class.java).apply {
        action = NidaaVpnService.ACTION_STOP
      }
      try { context.startService(stop) } catch (_: Throwable) {}
      updateAll(context)
      return
    }

    // Need permission?
    val prep = try { VpnService.prepare(context) } catch (_: Throwable) { null }
    if (prep != null) {
      openApp(context); return
    }

    val cfg = ModeRegistry.configFor(mode) ?: run { openApp(context); return }
    val last = VpnPrefs.loadLast(context)
    val blocklist = last?.blocklist ?: emptySet()
    val whitelist = last?.whitelist ?: emptySet()
    val excluded = last?.excluded ?: emptySet()

    val start = Intent(context, NidaaVpnService::class.java).apply {
      action = NidaaVpnService.ACTION_START
      putExtra(NidaaVpnService.EXTRA_PRIMARY, cfg.primary)
      putExtra(NidaaVpnService.EXTRA_SECONDARY, cfg.secondary)
      putExtra(NidaaVpnService.EXTRA_USE_DOH, cfg.useDoH)
      putExtra(NidaaVpnService.EXTRA_NAME, cfg.label)
      putExtra(NidaaVpnService.EXTRA_MODE_ID, cfg.id)
      putExtra(NidaaVpnService.EXTRA_BLOCKLIST, blocklist.toTypedArray())
      putExtra(NidaaVpnService.EXTRA_WHITELIST, whitelist.toTypedArray())
      putExtra(NidaaVpnService.EXTRA_EXCLUDED, excluded.toTypedArray())
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

/**
 * Single source of truth for mode → DNS / DoH config used by widgets and tiles.
 */
internal object ModeRegistry {
  data class ModeConfig(
    val id: String,
    val label: String,
    val primary: String,
    val secondary: String?,
    val useDoH: Boolean,
  )

  fun configFor(modeId: String): ModeConfig? = when (modeId) {
    "smart" -> ModeConfig(
      "smart", "الدرع الذكي",
      "94.140.14.14", "94.140.15.15", false
    )
    "gaming" -> ModeConfig(
      "gaming", "توربو الألعاب",
      "1.1.1.1", "1.0.0.1", false
    )
    "family" -> ModeConfig(
      "family", "حارس العائلة",
      "185.228.168.168", "185.228.169.168", false
    )
    "military" -> ModeConfig(
      "military", "الخصوصية العسكرية",
      "1.1.1.1", "1.0.0.1", true
    )
    else -> null
  }
}
