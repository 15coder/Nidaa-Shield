package expo.modules.nidaavpn

import java.net.InetAddress
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Minimal IPv4 + UDP + DNS packet helpers — only what we need for a DNS-only proxy:
 *  - parse outgoing DNS query: extract qname + transaction id
 *  - build NXDOMAIN response (for blocked domains)
 *  - build UDP/IPv4 wrapper around an upstream DNS payload (echoed back to tun)
 */
object DnsPacket {
  data class ParsedQuery(
    val rawQueryPayload: ByteArray, // the DNS payload itself (no IP/UDP)
    val qname: String,
    val transactionId: Short,
    // IPv4 + UDP envelope info (so we can build the response)
    val srcIp: ByteArray,
    val dstIp: ByteArray,
    val srcPort: Int,
    val dstPort: Int,
  )

  /** Parse an IPv4/UDP/DNS packet read from the tun. Returns null if not a DNS query. */
  fun parseFromTun(buffer: ByteArray, length: Int): ParsedQuery? {
    if (length < 28) return null
    val versionIhl = buffer[0].toInt() and 0xFF
    val version = versionIhl ushr 4
    if (version != 4) return null
    val ihl = (versionIhl and 0x0F) * 4
    if (ihl < 20 || length < ihl + 8) return null

    val protocol = buffer[9].toInt() and 0xFF
    if (protocol != 17) return null // UDP only

    val srcIp = buffer.copyOfRange(12, 16)
    val dstIp = buffer.copyOfRange(16, 20)

    val srcPort = ((buffer[ihl].toInt() and 0xFF) shl 8) or (buffer[ihl + 1].toInt() and 0xFF)
    val dstPort = ((buffer[ihl + 2].toInt() and 0xFF) shl 8) or (buffer[ihl + 3].toInt() and 0xFF)
    val udpLen = ((buffer[ihl + 4].toInt() and 0xFF) shl 8) or (buffer[ihl + 5].toInt() and 0xFF)

    if (dstPort != 53) return null
    val dnsStart = ihl + 8
    val dnsLen = udpLen - 8
    if (dnsLen < 12 || dnsStart + dnsLen > length) return null

    val dns = buffer.copyOfRange(dnsStart, dnsStart + dnsLen)
    val txId = ((dns[0].toInt() and 0xFF shl 8) or (dns[1].toInt() and 0xFF)).toShort()

    val qname = parseQName(dns, 12) ?: return null

    return ParsedQuery(
      rawQueryPayload = dns,
      qname = qname,
      transactionId = txId,
      srcIp = srcIp,
      dstIp = dstIp,
      srcPort = srcPort,
      dstPort = dstPort,
    )
  }

  private fun parseQName(dns: ByteArray, startOffset: Int): String? {
    var i = startOffset
    val sb = StringBuilder()
    while (i < dns.size) {
      val len = dns[i].toInt() and 0xFF
      if (len == 0) break
      if (len and 0xC0 != 0) return null // we don't handle pointers in queries (shouldn't appear)
      if (i + 1 + len > dns.size) return null
      if (sb.isNotEmpty()) sb.append('.')
      sb.append(String(dns, i + 1, len, Charsets.US_ASCII))
      i += 1 + len
    }
    return sb.toString().lowercase()
  }

  /** Build NXDOMAIN DNS response payload (header flags = response, RCODE=3) for the given query. */
  fun buildNxDomainPayload(query: ParsedQuery): ByteArray {
    val q = query.rawQueryPayload
    val out = q.copyOf()
    // Flags: QR=1, OPCODE=0, AA=0, TC=0, RD=copy, RA=1, RCODE=3 (NXDOMAIN)
    val rd = (q[2].toInt() and 0x01)
    out[2] = (0x80 or (rd shl 0)).toByte()
    out[3] = (0x80 or 0x03).toByte()
    // ANCOUNT=0, NSCOUNT=0, ARCOUNT=0
    out[6] = 0; out[7] = 0
    out[8] = 0; out[9] = 0
    out[10] = 0; out[11] = 0
    return out
  }

  /**
   * Build a full IPv4+UDP packet from an upstream DNS response payload that should appear
   * to come from the original DNS server back to the original client.
   */
  fun wrapResponse(query: ParsedQuery, dnsPayload: ByteArray): ByteArray {
    val udpLen = 8 + dnsPayload.size
    val totalLen = 20 + udpLen
    val buf = ByteBuffer.allocate(totalLen).order(ByteOrder.BIG_ENDIAN)

    // ----- IPv4 header (20 bytes) -----
    buf.put(0x45.toByte())          // version=4, IHL=5
    buf.put(0x00.toByte())          // DSCP/ECN
    buf.putShort(totalLen.toShort())
    buf.putShort(0x0000.toShort())  // identification
    buf.putShort(0x4000.toShort())  // flags=DF, fragment offset=0
    buf.put(0x40.toByte())          // TTL=64
    buf.put(17.toByte())            // protocol=UDP
    val checksumPos = buf.position()
    buf.putShort(0x0000.toShort())  // header checksum (filled later)
    buf.put(query.dstIp)            // src ip = original dst (the fake DNS)
    buf.put(query.srcIp)            // dst ip = original src (the device)

    // Compute IPv4 header checksum
    val arr = buf.array()
    val ipChecksum = ipChecksum16(arr, 0, 20)
    arr[checksumPos] = ((ipChecksum ushr 8) and 0xFF).toByte()
    arr[checksumPos + 1] = (ipChecksum and 0xFF).toByte()

    // ----- UDP header (8 bytes) -----
    buf.putShort(query.dstPort.toShort()) // src port = 53
    buf.putShort(query.srcPort.toShort()) // dst port = original src port
    buf.putShort(udpLen.toShort())
    buf.putShort(0x0000.toShort())        // udp checksum = 0 (optional for IPv4)

    // ----- DNS payload -----
    buf.put(dnsPayload)

    return buf.array()
  }

  private fun ipChecksum16(data: ByteArray, offset: Int, length: Int): Int {
    var sum = 0L
    var i = offset
    val end = offset + length
    while (i + 1 < end) {
      val word = ((data[i].toInt() and 0xFF) shl 8) or (data[i + 1].toInt() and 0xFF)
      sum += word
      i += 2
    }
    if (i < end) sum += (data[i].toInt() and 0xFF) shl 8
    while ((sum ushr 16) != 0L) sum = (sum and 0xFFFF) + (sum ushr 16)
    return ((sum.inv()).toInt()) and 0xFFFF
  }

  fun bytesToIpString(b: ByteArray): String =
    InetAddress.getByAddress(b).hostAddress ?: "?"
}
