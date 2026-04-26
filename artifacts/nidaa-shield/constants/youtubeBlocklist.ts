/**
 * Curated list of domains used by YouTube/Google to deliver in-stream ads,
 * trackers and beacon pixels. Adding these to the user's blocklist makes
 * "نداء شايلد" significantly more aggressive at killing YouTube ads.
 *
 * Note: YouTube delivers some ad video segments from the same CDN as legit
 * videos (googlevideo.com), so DNS-level blocking will never reach 100%, but
 * this list eliminates the vast majority of pre-roll/banner ads and tracking.
 */
export const YOUTUBE_AD_DOMAINS: string[] = [
  // Core Google ad-serving infrastructure
  "doubleclick.net",
  "googleads.g.doubleclick.net",
  "googleadservices.com",
  "googlesyndication.com",
  "pagead2.googlesyndication.com",
  "tpc.googlesyndication.com",
  "pubads.g.doubleclick.net",
  "stats.g.doubleclick.net",
  "ad.doubleclick.net",
  "adservice.google.com",
  "adservice.google.com.sa",
  "adservice.google.ae",
  "adservice.google.com.eg",

  // YouTube-specific ad endpoints
  "youtube-nocookie.com",
  "ytimg.l.google.com",
  "youtubei.googleapis.com.ads",
  "yt3.ggpht.com.ads",
  "i.ytimg.com.ads",

  // Analytics & tracking pixels
  "google-analytics.com",
  "ssl.google-analytics.com",
  "www.google-analytics.com",
  "analytics.google.com",
  "googletagmanager.com",
  "googletagservices.com",

  // Third-party ad networks frequently shown on YouTube
  "amazon-adsystem.com",
  "adnxs.com",
  "criteo.com",
  "criteo.net",
  "moatads.com",
  "scorecardresearch.com",
  "outbrain.com",
  "taboola.com",
];

export const YOUTUBE_BLOCKLIST_VERSION = 2;
