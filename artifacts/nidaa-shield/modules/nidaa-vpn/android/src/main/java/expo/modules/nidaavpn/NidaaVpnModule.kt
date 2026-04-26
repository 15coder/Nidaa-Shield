package expo.modules.nidaavpn

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.VpnService
import android.os.Build
import android.util.Base64
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class NidaaVpnModule : Module() {

  private val context: Context
    get() = appContext.reactContext
      ?: throw CodedException("NO_CONTEXT", "React context unavailable", null)

  private var pendingPermission: Promise? = null
  private val permissionRequestCode = 0xA197

  override fun definition() = ModuleDefinition {
    Name("NidaaVpn")

    AsyncFunction("requestPermission") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      val intent = VpnService.prepare(context)
      if (intent == null) {
        // Already granted
        promise.resolve(true)
      } else {
        if (pendingPermission != null) {
          pendingPermission?.resolve(false)
        }
        pendingPermission = promise
        try {
          activity.startActivityForResult(intent, permissionRequestCode)
        } catch (t: Throwable) {
          pendingPermission = null
          promise.resolve(false)
        }
      }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode == permissionRequestCode) {
        val granted = payload.resultCode == android.app.Activity.RESULT_OK
        pendingPermission?.resolve(granted)
        pendingPermission = null
      }
    }

    AsyncFunction("startVpn") { config: Map<String, Any?>, promise: Promise ->
      try {
        val intent = Intent(context, NidaaVpnService::class.java).apply {
          action = NidaaVpnService.ACTION_START
          putExtra(NidaaVpnService.EXTRA_NAME, config["sessionName"] as? String ?: "نداء شايلد")
          putExtra(NidaaVpnService.EXTRA_PRIMARY, config["primaryDns"] as? String ?: "1.1.1.1")
          (config["secondaryDns"] as? String)?.let {
            putExtra(NidaaVpnService.EXTRA_SECONDARY, it)
          }
          putExtra(NidaaVpnService.EXTRA_USE_DOH, config["useDoH"] as? Boolean ?: false)
          (config["modeId"] as? String)?.let {
            putExtra(NidaaVpnService.EXTRA_MODE_ID, it)
          }
          putExtra(NidaaVpnService.EXTRA_BLOCKLIST, toStringArray(config["blocklist"]))
          putExtra(NidaaVpnService.EXTRA_WHITELIST, toStringArray(config["whitelist"]))
          putExtra(NidaaVpnService.EXTRA_EXCLUDED, toStringArray(config["excludedApps"]))
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(intent)
        } else {
          context.startService(intent)
        }
        promise.resolve(true)
      } catch (t: Throwable) {
        promise.resolve(false)
      }
    }

    AsyncFunction("stopVpn") { promise: Promise ->
      try {
        val intent = Intent(context, NidaaVpnService::class.java).apply {
          action = NidaaVpnService.ACTION_STOP
        }
        context.startService(intent)
        promise.resolve(true)
      } catch (t: Throwable) {
        promise.resolve(false)
      }
    }

    AsyncFunction("isRunning") { promise: Promise ->
      promise.resolve(VpnState.isRunning)
    }

    AsyncFunction("getStats") { promise: Promise ->
      val map: Map<String, Any?> = mapOf(
        "totalQueries" to VpnState.totalQueries.get().toDouble(),
        "blockedQueries" to VpnState.blockedQueries.get().toDouble(),
        "forwardedQueries" to VpnState.forwardedQueries.get().toDouble(),
        "dohQueries" to VpnState.dohQueries.get().toDouble(),
        "averageLatencyMs" to VpnState.averageLatencyMs(),
        "lastDomain" to VpnState.lastDomain.get(),
        "lastBlockedDomain" to VpnState.lastBlockedDomain.get(),
        "startedAtMs" to VpnState.startedAtMs.toDouble(),
        "uptimeMs" to VpnState.uptimeMs().toDouble(),
      )
      promise.resolve(map)
    }

    AsyncFunction("getCurrentSession") { promise: Promise ->
      val map: Map<String, Any?> = mapOf(
        "isRunning" to VpnState.isRunning,
        "session" to VpnState.sessionName,
        "modeId" to VpnState.modeId,
      )
      promise.resolve(map)
    }

    AsyncFunction("setAutoStart") { enabled: Boolean, promise: Promise ->
      VpnPrefs.setAutoStart(context, enabled)
      promise.resolve(true)
    }

    AsyncFunction("listInstalledApps") { promise: Promise ->
      try {
        val pm = context.packageManager
        val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
        val out = ArrayList<Map<String, Any?>>(apps.size)
        for (a in apps) {
          if (a.packageName == context.packageName) continue
          val isSystem = (a.flags and ApplicationInfo.FLAG_SYSTEM) != 0 &&
            (a.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) == 0
          val label = try { pm.getApplicationLabel(a).toString() } catch (_: Throwable) { a.packageName }
          out.add(
            mapOf(
              "packageName" to a.packageName,
              "label" to label,
              "isSystem" to isSystem,
            )
          )
        }
        out.sortBy { (it["label"] as? String)?.lowercase() ?: "" }
        promise.resolve(out)
      } catch (t: Throwable) {
        promise.resolve(emptyList<Map<String, Any?>>())
      }
    }

    AsyncFunction("getAppIcon") { packageName: String, promise: Promise ->
      try {
        val pm = context.packageManager
        val drawable: Drawable = pm.getApplicationIcon(packageName)
        val bmp = drawableToBitmap(drawable)
        val baos = ByteArrayOutputStream()
        bmp.compress(Bitmap.CompressFormat.PNG, 100, baos)
        val b64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
        promise.resolve("data:image/png;base64,$b64")
      } catch (t: Throwable) {
        promise.resolve(null)
      }
    }
  }

  private fun toStringArray(v: Any?): Array<String> {
    return when (v) {
      is List<*> -> v.mapNotNull { it as? String }.toTypedArray()
      is Array<*> -> v.mapNotNull { it as? String }.toTypedArray()
      else -> emptyArray()
    }
  }

  private fun drawableToBitmap(d: Drawable): Bitmap {
    if (d is BitmapDrawable && d.bitmap != null) return d.bitmap
    val w = if (d.intrinsicWidth > 0) d.intrinsicWidth else 96
    val h = if (d.intrinsicHeight > 0) d.intrinsicHeight else 96
    val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bmp)
    d.setBounds(0, 0, canvas.width, canvas.height)
    d.draw(canvas)
    return bmp
  }
}
