package expo.modules.nidaavpn

import android.content.Context
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference

/**
 * Process-wide singleton holding VPN runtime state and stats counters.
 * The Module bridge reads this; the running NidaaVpnService writes to it.
 */
object VpnState {
  @Volatile var isRunning: Boolean = false
  @Volatile var sessionName: String? = null
  @Volatile var modeId: String? = null
  @Volatile var startedAtMs: Long = 0L

  val totalQueries = AtomicLong(0)
  val blockedQueries = AtomicLong(0)
  val forwardedQueries = AtomicLong(0)
  val dohQueries = AtomicLong(0)
  val totalLatencyMs = AtomicLong(0)
  val lastDomain = AtomicReference<String?>(null)
  val lastBlockedDomain = AtomicReference<String?>(null)

  // Live config (updated when service starts)
  @Volatile var primaryDns: String = "1.1.1.1"
  @Volatile var secondaryDns: String? = null
  @Volatile var useDoH: Boolean = false
  @Volatile var blocklist: Set<String> = emptySet()
  @Volatile var whitelist: Set<String> = emptySet()
  @Volatile var excludedApps: Set<String> = emptySet()

  fun reset() {
    totalQueries.set(0)
    blockedQueries.set(0)
    forwardedQueries.set(0)
    dohQueries.set(0)
    totalLatencyMs.set(0)
    lastDomain.set(null)
    lastBlockedDomain.set(null)
  }

  fun averageLatencyMs(): Double {
    val total = totalQueries.get()
    if (total == 0L) return 0.0
    return totalLatencyMs.get().toDouble() / total.toDouble()
  }

  fun uptimeMs(): Long {
    if (startedAtMs == 0L) return 0L
    return System.currentTimeMillis() - startedAtMs
  }
}

/**
 * Persisted preferences for boot-restore + last-session memory.
 */
object VpnPrefs {
  private const val PREFS = "nidaa_vpn_prefs"
  private const val K_AUTO_START = "auto_start"
  private const val K_LAST_PRIMARY = "last_primary"
  private const val K_LAST_SECONDARY = "last_secondary"
  private const val K_LAST_DOH = "last_doh"
  private const val K_LAST_MODE = "last_mode"
  private const val K_LAST_NAME = "last_name"
  private const val K_LAST_BLOCK = "last_block"
  private const val K_LAST_WHITE = "last_white"
  private const val K_LAST_EXCL = "last_excl"

  fun setAutoStart(ctx: Context, enabled: Boolean) {
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(K_AUTO_START, enabled)
      .apply()
  }

  fun isAutoStart(ctx: Context): Boolean =
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(K_AUTO_START, false)

  fun saveLast(
    ctx: Context,
    name: String,
    modeId: String?,
    primary: String,
    secondary: String?,
    useDoH: Boolean,
    blocklist: Set<String>,
    whitelist: Set<String>,
    excluded: Set<String>,
  ) {
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(K_LAST_NAME, name)
      .putString(K_LAST_MODE, modeId)
      .putString(K_LAST_PRIMARY, primary)
      .putString(K_LAST_SECONDARY, secondary)
      .putBoolean(K_LAST_DOH, useDoH)
      .putStringSet(K_LAST_BLOCK, blocklist)
      .putStringSet(K_LAST_WHITE, whitelist)
      .putStringSet(K_LAST_EXCL, excluded)
      .apply()
  }

  data class LastConfig(
    val name: String,
    val modeId: String?,
    val primary: String,
    val secondary: String?,
    val useDoH: Boolean,
    val blocklist: Set<String>,
    val whitelist: Set<String>,
    val excluded: Set<String>,
  )

  fun loadLast(ctx: Context): LastConfig? {
    val sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val primary = sp.getString(K_LAST_PRIMARY, null) ?: return null
    return LastConfig(
      name = sp.getString(K_LAST_NAME, "نداء شايلد") ?: "نداء شايلد",
      modeId = sp.getString(K_LAST_MODE, null),
      primary = primary,
      secondary = sp.getString(K_LAST_SECONDARY, null),
      useDoH = sp.getBoolean(K_LAST_DOH, false),
      blocklist = sp.getStringSet(K_LAST_BLOCK, emptySet()) ?: emptySet(),
      whitelist = sp.getStringSet(K_LAST_WHITE, emptySet()) ?: emptySet(),
      excluded = sp.getStringSet(K_LAST_EXCL, emptySet()) ?: emptySet(),
    )
  }
}
