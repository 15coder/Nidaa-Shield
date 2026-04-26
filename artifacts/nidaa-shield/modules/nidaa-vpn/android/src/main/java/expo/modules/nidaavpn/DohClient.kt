package expo.modules.nidaavpn

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Minimal DNS-over-HTTPS client (Cloudflare cloudflare-dns.com /dns-query).
 * Sends the raw DNS wire-format query as POST body, returns raw DNS wire-format response.
 */
class DohClient {
  private val client: OkHttpClient = OkHttpClient.Builder()
    .connectTimeout(4, TimeUnit.SECONDS)
    .readTimeout(4, TimeUnit.SECONDS)
    .writeTimeout(4, TimeUnit.SECONDS)
    .retryOnConnectionFailure(true)
    .build()

  private val dnsMessageType = "application/dns-message".toMediaType()

  fun resolve(rawDnsQuery: ByteArray, endpoint: String = "https://cloudflare-dns.com/dns-query"): ByteArray? {
    return try {
      val body = rawDnsQuery.toRequestBody(dnsMessageType)
      val req = Request.Builder()
        .url(endpoint)
        .header("Accept", "application/dns-message")
        .post(body)
        .build()
      client.newCall(req).execute().use { resp ->
        if (!resp.isSuccessful) return null
        resp.body?.bytes()
      }
    } catch (_: Throwable) {
      null
    }
  }
}
