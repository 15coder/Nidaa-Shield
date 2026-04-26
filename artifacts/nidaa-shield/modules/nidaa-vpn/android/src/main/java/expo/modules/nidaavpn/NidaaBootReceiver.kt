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
    val svc = Intent(context, NidaaVpnService::class.java)
    svc.action = NidaaVpnService.ACTION_START
    svc.putExtra(NidaaVpnService.EXTRA_PRIMARY, cfg.primary)
    svc.putExtra(NidaaVpnService.EXTRA_SECONDARY, cfg.secondary)
    svc.putExtra(NidaaVpnService.EXTRA_USE_DOH, cfg.useDoH)
    svc.putExtra(NidaaVpnService.EXTRA_NAME, cfg.name)
    svc.putExtra(NidaaVpnService.EXTRA_MODE_ID, cfg.modeId)
    svc.putExtra(NidaaVpnService.EXTRA_BLOCKLIST, cfg.blocklist.toTypedArray())
    svc.putExtra(NidaaVpnService.EXTRA_WHITELIST, cfg.whitelist.toTypedArray())
    svc.putExtra(NidaaVpnService.EXTRA_EXCLUDED, cfg.excluded.toTypedArray())
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(svc)
    } else {
      context.startService(svc)
    }
    // Refresh widgets after auto-start. Service will also call updateAll
    // once it's running, but this gives the widget an immediate hint.
    try { NidaaWidgetProvider.updateAll(context) } catch (_: Throwable) {}
  }
}
