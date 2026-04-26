package expo.modules.nidaavpn

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build

class NidaaBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    if (action != Intent.ACTION_BOOT_COMPLETED && action != "android.intent.action.QUICKBOOT_POWERON") return
    if (!VpnPrefs.isAutoStart(context)) return
    val cfg = VpnPrefs.loadLast(context) ?: return
    // Only safe to start if user previously granted permission to our app
    if (VpnService.prepare(context) != null) return
    val svc = Intent(context, NidaaVpnService::class.java).apply {
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
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(svc)
    } else {
      context.startService(svc)
    }
  }
}
