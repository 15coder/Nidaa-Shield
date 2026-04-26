package expo.modules.nidaavpn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.service.quicksettings.TileService
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.InetSocketAddress
import kotlin.concurrent.thread

class NidaaVpnService : VpnService() {

  companion object {
    private const val TAG = "NidaaVpnService"
    private const val CHANNEL_ID = "nidaa_vpn_channel"
    private const val NOTIFICATION_ID = 4197
    const val ACTION_START = "expo.modules.nidaavpn.START"
    const val ACTION_STOP = "expo.modules.nidaavpn.STOP"
    const val EXTRA_PRIMARY = "primary"
    const val EXTRA_SECONDARY = "secondary"
    const val EXTRA_USE_DOH = "useDoH"
    const val EXTRA_NAME = "name"
    const val EXTRA_MODE_ID = "modeId"
    const val EXTRA_BLOCKLIST = "blocklist"
    const val EXTRA_WHITELIST = "whitelist"
    const val EXTRA_EXCLUDED = "excluded"

    // Tun-internal addresses. We use a tiny /32 subnet and route only the
    // fake DNS server through us — all other traffic bypasses the VPN entirely
    // for full speed and battery efficiency.
    private const val TUN_ADDRESS = "10.197.0.2"
    private const val TUN_DNS = "10.197.0.3"
  }

  @Volatile private var tun: ParcelFileDescriptor? = null
  @Volatile private var workerThread: Thread? = null
  @Volatile private var notifThread: Thread? = null
  @Volatile private var running = false
  private val doh = DohClient()

  /** Mode definitions used to build quick-switch notification action buttons. */
  data class QuickMode(
    val id: String,
    val label: String,
    val primary: String,
    val secondary: String,
    val useDoH: Boolean,
  )

  private val QUICK_MODES = listOf(
    QuickMode("smart", "ذكي", "94.140.14.14", "94.140.15.15", false),
    QuickMode("gaming", "ألعاب", "1.1.1.1", "1.0.0.1", false),
    QuickMode("family", "عائلة", "94.140.14.15", "94.140.15.16", false),
    QuickMode("military", "خصوصية", "1.1.1.1", "1.0.0.1", true),
  )

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      teardown()
      stopSelf()
      return START_NOT_STICKY
    }

    val primary = intent?.getStringExtra(EXTRA_PRIMARY) ?: "1.1.1.1"
    val secondary = intent?.getStringExtra(EXTRA_SECONDARY)
    val useDoH = intent?.getBooleanExtra(EXTRA_USE_DOH, false) ?: false
    val name = intent?.getStringExtra(EXTRA_NAME) ?: "نداء شايلد"
    val modeId = intent?.getStringExtra(EXTRA_MODE_ID)
    val blocklist = intent?.getStringArrayExtra(EXTRA_BLOCKLIST)?.toSet() ?: emptySet()
    val whitelist = intent?.getStringArrayExtra(EXTRA_WHITELIST)?.toSet() ?: emptySet()
    val excluded = intent?.getStringArrayExtra(EXTRA_EXCLUDED)?.toSet() ?: emptySet()

    VpnState.primaryDns = primary
    VpnState.secondaryDns = secondary
    VpnState.useDoH = useDoH
    VpnState.blocklist = blocklist
    VpnState.whitelist = whitelist
    VpnState.excludedApps = excluded
    VpnState.sessionName = name
    VpnState.modeId = modeId
    VpnState.startedAtMs = System.currentTimeMillis()
    VpnState.reset()

    VpnPrefs.saveLast(this, name, modeId, primary, secondary, useDoH, blocklist, whitelist, excluded)

    startForegroundCompat(name)

    val ok = establishTunnel(name, excluded)
    if (!ok) {
      stopSelf()
      return START_NOT_STICKY
    }

    VpnState.isRunning = true
    running = true
    workerThread = thread(name = "nidaa-vpn-worker", isDaemon = true) { runLoop() }
    notifThread = thread(name = "nidaa-vpn-notif", isDaemon = true) { notifLoop() }

    notifySystemSurfaces()

    return START_STICKY
  }

  /**
   * Refreshes the persistent notification every few seconds so the user sees
   * the live blocked-count and active mode without leaving the app.
   */
  private fun notifLoop() {
    while (running) {
      try {
        Thread.sleep(5_000)
        if (!running) break
        startForegroundCompat(VpnState.sessionName ?: "نداء شايلد")
      } catch (_: InterruptedException) {
        break
      } catch (_: Throwable) {
        // never let the notif loop kill the service
      }
    }
  }

  private fun notifySystemSurfaces() {
    // Ask the system to re-bind all our quick-settings tiles so their labels/states update.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      val tiles = listOf(
        NidaaTileService::class.java,
        SmartModeTileService::class.java,
        GamingModeTileService::class.java,
        FamilyModeTileService::class.java,
        MilitaryModeTileService::class.java,
      )
      for (cls in tiles) {
        try {
          TileService.requestListeningState(
            applicationContext,
            ComponentName(applicationContext, cls),
          )
        } catch (_: Throwable) {}
      }
    }
  }

  private fun establishTunnel(sessionName: String, excludedPackages: Set<String>): Boolean {
    val builder = Builder()
      .setSession(sessionName)
      .addAddress(TUN_ADDRESS, 32)
      .addDnsServer(TUN_DNS)
      // route ONLY the fake DNS — everything else bypasses our tun
      .addRoute(TUN_DNS, 32)
      .setMtu(1500)
      .setBlocking(true)

    // Don't capture our own app's traffic, plus any user-excluded apps
    safeDisallow(builder, packageName)
    for (pkg in excludedPackages) safeDisallow(builder, pkg)

    return try {
      val pfd = builder.establish()
      if (pfd == null) {
        Log.e(TAG, "establish() returned null")
        return false
      }
      tun = pfd
      Log.i(TAG, "VPN tunnel established for session=$sessionName")
      true
    } catch (t: Throwable) {
      Log.e(TAG, "establish() failed", t)
      false
    }
  }

  private fun safeDisallow(builder: Builder, pkg: String) {
    try { builder.addDisallowedApplication(pkg) } catch (_: Throwable) {}
  }

  private fun runLoop() {
    val pfd = tun ?: return
    val input = FileInputStream(pfd.fileDescriptor)
    val output = FileOutputStream(pfd.fileDescriptor)
    val buf = ByteArray(2048)

    while (running) {
      try {
        val len = input.read(buf)
        if (len <= 0) continue
        val parsed = DnsPacket.parseFromTun(buf, len) ?: continue
        VpnState.totalQueries.incrementAndGet()
        VpnState.lastDomain.set(parsed.qname)

        if (isBlocked(parsed.qname)) {
          val nx = DnsPacket.buildNxDomainPayload(parsed)
          val pkt = DnsPacket.wrapResponse(parsed, nx)
          output.write(pkt)
          VpnState.blockedQueries.incrementAndGet()
          VpnState.lastBlockedDomain.set(parsed.qname)
          continue
        }

        // forward
        val started = System.currentTimeMillis()
        val resp = if (VpnState.useDoH) {
          val r = doh.resolve(parsed.rawQueryPayload)
          if (r != null) VpnState.dohQueries.incrementAndGet()
          r
        } else {
          forwardUdp(parsed.rawQueryPayload, VpnState.primaryDns, VpnState.secondaryDns)
        }
        val latency = System.currentTimeMillis() - started

        if (resp != null) {
          val pkt = DnsPacket.wrapResponse(parsed, resp)
          output.write(pkt)
          VpnState.forwardedQueries.incrementAndGet()
          VpnState.totalLatencyMs.addAndGet(latency)
        }
      } catch (_: java.io.IOException) {
        if (!running) break
        // ignore transient read errors
      } catch (t: Throwable) {
        Log.w(TAG, "loop error", t)
      }
    }
  }

  private fun isBlocked(domain: String): Boolean {
    if (matchesAny(domain, VpnState.whitelist)) return false
    if (matchesAny(domain, VpnState.blocklist)) return true
    return false
  }

  private fun matchesAny(domain: String, list: Set<String>): Boolean {
    if (list.isEmpty()) return false
    val d = domain.lowercase()
    for (entry in list) {
      val e = entry.lowercase().trim()
      if (e.isEmpty()) continue
      if (d == e || d.endsWith(".$e")) return true
    }
    return false
  }

  /**
   * Public, well-known recursive resolvers that act as the last-resort
   * fallback if both the user-selected DNS and its secondary fail. Order
   * matters: we go cyan-Cloudflare → Google → Quad9 (DNSSEC).
   */
  private val FALLBACK_DNS = listOf("1.1.1.1", "8.8.8.8", "9.9.9.9")

  private fun forwardUdp(query: ByteArray, primary: String, secondary: String?): ByteArray? {
    // Walk the full chain: primary → secondary → public fallbacks.
    // De-duplicate so we don't probe the same server twice when the user
    // already chose a public resolver.
    val ordered = LinkedHashSet<String>()
    ordered.add(primary)
    if (secondary != null) ordered.add(secondary)
    for (s in FALLBACK_DNS) ordered.add(s)

    var lastFailure: String? = null
    for (server in ordered) {
      val r = sendUdpDns(query, server)
      if (r != null) {
        if (server != primary) {
          // Track that we had to fall back; useful for diagnostics.
          VpnState.fallbackHits.incrementAndGet()
        }
        return r
      }
      lastFailure = server
    }
    if (lastFailure != null) {
      Log.w(TAG, "All upstream DNS failed (last=$lastFailure)")
    }
    return null
  }

  private fun sendUdpDns(query: ByteArray, server: String): ByteArray? {
    var sock: DatagramSocket? = null
    return try {
      sock = DatagramSocket()
      protect(sock)
      sock.soTimeout = 3000
      val addr = InetAddress.getByName(server)
      sock.send(DatagramPacket(query, query.size, InetSocketAddress(addr, 53)))
      val buf = ByteArray(2048)
      val pkt = DatagramPacket(buf, buf.size)
      sock.receive(pkt)
      buf.copyOfRange(0, pkt.length)
    } catch (_: Throwable) {
      null
    } finally {
      try { sock?.close() } catch (_: Throwable) {}
    }
  }

  private fun startForegroundCompat(sessionName: String) {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val ch = NotificationChannel(CHANNEL_ID, "نداء شايلد", NotificationManager.IMPORTANCE_LOW).apply {
        description = "حالة الحماية النشطة"
        setShowBadge(false)
      }
      nm.createNotificationChannel(ch)
    }

    val openIntent = packageManager.getLaunchIntentForPackage(packageName)
    val piFlags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val openPi = if (openIntent != null) PendingIntent.getActivity(this, 0, openIntent, piFlags) else null

    val stopIntent = Intent(this, NidaaVpnService::class.java).setAction(ACTION_STOP)
    val stopPi = PendingIntent.getService(this, 1, stopIntent, piFlags)

    val blocked = VpnState.blockedQueries.get()
    val total = VpnState.totalQueries.get()
    val activeId = VpnState.modeId
    val activeLabel = QUICK_MODES.firstOrNull { it.id == activeId }?.label ?: sessionName

    val contentText = if (total > 0) {
      "$activeLabel • حُجب ${blocked} إعلان من ${total} طلب"
    } else {
      "$activeLabel • في انتظار أول طلب…"
    }

    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_lock)
      .setContentTitle("نداء شايلد — الحماية مفعّلة")
      .setContentText(contentText)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setContentIntent(openPi)
      .addAction(android.R.drawable.ic_menu_close_clear_cancel, "إيقاف", stopPi)

    // Add up to two quick-switch action buttons for non-active modes
    // (Android only renders ~3 actions total in the notification UI).
    val others = QUICK_MODES.filter { it.id != activeId }.take(2)
    others.forEachIndexed { idx, m ->
      val swIntent = Intent(this, NidaaVpnService::class.java).apply {
        action = ACTION_START
        putExtra(EXTRA_PRIMARY, m.primary)
        putExtra(EXTRA_SECONDARY, m.secondary)
        putExtra(EXTRA_USE_DOH, m.useDoH)
        putExtra(EXTRA_NAME, m.label)
        putExtra(EXTRA_MODE_ID, m.id)
        // Carry over current blocklist/whitelist/excluded so the user's
        // configuration survives a notification quick-switch.
        putExtra(EXTRA_BLOCKLIST, VpnState.blocklist.toTypedArray())
        putExtra(EXTRA_WHITELIST, VpnState.whitelist.toTypedArray())
        putExtra(EXTRA_EXCLUDED, VpnState.excludedApps.toTypedArray())
      }
      val pi = PendingIntent.getService(this, 100 + idx, swIntent, piFlags)
      builder.addAction(0, m.label, pi)
    }

    val notif: Notification = builder.build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIFICATION_ID, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED)
    } else {
      startForeground(NOTIFICATION_ID, notif)
    }
  }

  private fun teardown() {
    running = false
    VpnState.isRunning = false
    VpnState.startedAtMs = 0L
    try { tun?.close() } catch (_: Throwable) {}
    tun = null
    try { notifThread?.interrupt() } catch (_: Throwable) {}
    notifThread = null
    workerThread = null
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      try { stopForeground(STOP_FOREGROUND_REMOVE) } catch (_: Throwable) {}
    } else {
      @Suppress("DEPRECATION")
      try { stopForeground(true) } catch (_: Throwable) {}
    }
    notifySystemSurfaces()
  }

  override fun onRevoke() {
    teardown()
    stopSelf()
    super.onRevoke()
  }

  override fun onDestroy() {
    teardown()
    super.onDestroy()
  }
}
