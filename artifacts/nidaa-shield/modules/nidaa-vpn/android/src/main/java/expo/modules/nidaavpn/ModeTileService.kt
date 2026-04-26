package expo.modules.nidaavpn

import android.content.Intent
import android.graphics.drawable.Icon
import android.net.VpnService
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

/**
 * Base class for per-mode Quick Settings tiles. Each subclass binds a single
 * protection mode (smart / gaming / family / military). Tapping the tile
 * activates that mode directly without opening the app.
 *
 * Tap behavior:
 *  - VPN OFF or running a different mode  -> start this mode.
 *  - VPN ON for the same mode             -> stop the VPN.
 */
abstract class BaseModeTileService : TileService() {

  abstract val modeId: String
  abstract val modeLabel: String
  abstract val modeSubtitle: String
  abstract val primaryDns: String
  abstract val secondaryDns: String?
  abstract val useDoH: Boolean
  abstract val iconRes: Int

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
    val running = VpnState.isRunning
    val sameMode = running && VpnState.modeId == modeId

    if (sameMode) {
      // Stop
      val stop = Intent(this, NidaaVpnService::class.java).apply {
        action = NidaaVpnService.ACTION_STOP
      }
      try { startService(stop) } catch (_: Throwable) {}
      refresh()
      return
    }

    // Need VPN permission?
    val prep = try { VpnService.prepare(this) } catch (_: Throwable) { null }
    if (prep != null) {
      openApp()
      return
    }

    // Pull last-saved blocklists / whitelists / excluded apps from prefs
    // so user-specific configuration is preserved across mode switches.
    val last = VpnPrefs.loadLast(this)
    val blocklist = last?.blocklist ?: emptySet()
    val whitelist = last?.whitelist ?: emptySet()
    val excluded = last?.excluded ?: emptySet()

    val start = Intent(this, NidaaVpnService::class.java).apply {
      action = NidaaVpnService.ACTION_START
      putExtra(NidaaVpnService.EXTRA_PRIMARY, primaryDns)
      putExtra(NidaaVpnService.EXTRA_SECONDARY, secondaryDns)
      putExtra(NidaaVpnService.EXTRA_USE_DOH, useDoH)
      putExtra(NidaaVpnService.EXTRA_NAME, modeLabel)
      putExtra(NidaaVpnService.EXTRA_MODE_ID, modeId)
      putExtra(NidaaVpnService.EXTRA_BLOCKLIST, blocklist.toTypedArray())
      putExtra(NidaaVpnService.EXTRA_WHITELIST, whitelist.toTypedArray())
      putExtra(NidaaVpnService.EXTRA_EXCLUDED, excluded.toTypedArray())
    }
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        startForegroundService(start)
      } else {
        startService(start)
      }
    } catch (_: Throwable) {}
    refresh()
  }

  private fun openApp() {
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return
    launch.flags = Intent.FLAG_ACTIVITY_NEW_TASK
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      try {
        startActivityAndCollapse(
          android.app.PendingIntent.getActivity(
            this, 0, launch,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
          )
        )
      } catch (_: Throwable) { startActivity(launch) }
    } else {
      @Suppress("DEPRECATION")
      try { startActivityAndCollapse(launch) } catch (_: Throwable) { startActivity(launch) }
    }
  }

  private fun refresh() {
    val tile = qsTile ?: return
    val active = VpnState.isRunning && VpnState.modeId == modeId
    tile.state = if (active) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
    tile.label = modeLabel
    tile.contentDescription = if (active) "إيقاف $modeLabel" else "تفعيل $modeLabel"
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      tile.subtitle = if (active) "مفعّل" else modeSubtitle
    }
    try {
      tile.icon = Icon.createWithResource(this, iconRes)
    } catch (_: Throwable) {}
    tile.updateTile()
  }
}

class SmartModeTileService : BaseModeTileService() {
  override val modeId = "smart"
  override val modeLabel = "الدرع الذكي"
  override val modeSubtitle = "حظر الإعلانات والتتبع"
  override val primaryDns = "94.140.14.14"
  override val secondaryDns: String? = "94.140.15.15"
  override val useDoH = false
  override val iconRes: Int = android.R.drawable.ic_menu_view
}

class GamingModeTileService : BaseModeTileService() {
  override val modeId = "gaming"
  override val modeLabel = "توربو الألعاب"
  override val modeSubtitle = "DNS سريع للألعاب"
  override val primaryDns = "1.1.1.1"
  override val secondaryDns: String? = "1.0.0.1"
  override val useDoH = false
  override val iconRes: Int = android.R.drawable.ic_media_play
}

class FamilyModeTileService : BaseModeTileService() {
  override val modeId = "family"
  override val modeLabel = "حارس العائلة"
  override val modeSubtitle = "حجب المحتوى الضار"
  override val primaryDns = "185.228.168.168"
  override val secondaryDns: String? = "185.228.169.168"
  override val useDoH = false
  override val iconRes: Int = android.R.drawable.ic_menu_myplaces
}

class MilitaryModeTileService : BaseModeTileService() {
  override val modeId = "military"
  override val modeLabel = "الخصوصية العسكرية"
  override val modeSubtitle = "تشفير DNS كامل"
  override val primaryDns = "1.1.1.1"
  override val secondaryDns: String? = "1.0.0.1"
  override val useDoH = true
  override val iconRes: Int = android.R.drawable.ic_lock_lock
}
