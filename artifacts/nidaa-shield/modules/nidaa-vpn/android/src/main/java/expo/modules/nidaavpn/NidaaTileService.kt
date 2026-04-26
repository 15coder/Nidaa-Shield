package expo.modules.nidaavpn

import android.content.Intent
import android.graphics.drawable.Icon
import android.net.VpnService
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

/**
 * Quick Settings Tile that lets the user toggle Nidaa Shield protection
 * directly from the system pull-down panel.
 *
 * Tapping the tile while VPN is OFF will:
 *  - If VPN permission was previously granted: start the service with the last
 *    known config (mode, DNS, lists).
 *  - Otherwise: open the app so the user can grant permission and pick a mode.
 *
 * Tapping while VPN is ON: stop the service.
 */
class NidaaTileService : TileService() {

  override fun onStartListening() {
    super.onStartListening()
    refresh()
  }

  override fun onTileAdded() {
    super.onTileAdded()
    refresh()
  }

  override fun onClick() {
    super.onClick()
    if (VpnState.isRunning) {
      // Stop
      val stop = Intent(this, NidaaVpnService::class.java).apply {
        action = NidaaVpnService.ACTION_STOP
      }
      try { startService(stop) } catch (_: Throwable) {}
    } else {
      // Start
      val prep = try { VpnService.prepare(this) } catch (_: Throwable) { null }
      if (prep != null) {
        // Need user interaction to grant permission — open the app
        openApp()
        return
      }
      val cfg = VpnPrefs.loadLast(this)
      if (cfg == null) {
        // No previous config — open the app so user can pick a mode
        openApp()
        return
      }
      val start = Intent(this, NidaaVpnService::class.java).apply {
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
          startForegroundService(start)
        } else {
          startService(start)
        }
      } catch (_: Throwable) {}
    }
    // Reflect optimistic state then re-poll on next onStartListening
    refresh()
  }

  private fun openApp() {
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return
    launch.flags = Intent.FLAG_ACTIVITY_NEW_TASK
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      try { startActivityAndCollapse(android.app.PendingIntent.getActivity(
        this, 0, launch,
        android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
      )) } catch (_: Throwable) { startActivity(launch) }
    } else {
      @Suppress("DEPRECATION")
      try { startActivityAndCollapse(launch) } catch (_: Throwable) { startActivity(launch) }
    }
  }

  private fun refresh() {
    val tile = qsTile ?: return
    val running = VpnState.isRunning
    tile.state = if (running) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
    tile.label = "نداء شايلد"
    tile.contentDescription = if (running) "إيقاف الحماية" else "تفعيل الحماية"
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      tile.subtitle = if (running) "الحماية مفعّلة" else "متوقّفة"
    }
    try {
      tile.icon = Icon.createWithResource(this, android.R.drawable.ic_lock_lock)
    } catch (_: Throwable) {}
    tile.updateTile()
  }
}
