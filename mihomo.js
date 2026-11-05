/**
 * 通用 Mihomo 预处理脚本 https://github.com/aaANDkk/ClashConfig
 * 基础配置与 mihomo.yaml 同步；私有 DNS / Hosts 处理参考 AIsouler 脚本。
 * 地区至少有 3 个手动可见节点时生成分组；家宽有 1 个即可，直连只在自动测速中排除。
 * 地区统计基于客户端传入的 config.proxies；远程 proxy-providers 不主动下载。
 */

const MIN_REGION_NODES = 3;
const ICON_BASE = 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/';
const clone = (value) => JSON.parse(JSON.stringify(value));
const asList = (value) => Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];

// 与 YAML 对齐的基础设置。
const baseConfig = {
  "ipv6": false,
  "allow-lan": true,
  "unified-delay": true,
  "etag-support": true,
  "tcp-concurrent": true,
  "reset-network-change": true,
  "auto-detect-interface": true,
  "udp-timeout": 30,
  "keep-alive-interval": 60,
  "bind-address": "*",
  "find-process-mode": "strict",
  "mode": "rule",
  "log-level": "info",
  "external-controller": "127.0.0.1:9090",
  "external-ui": "ui",
  "external-ui-url": "https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip",
  "dns": {
    "enable": true,
    "use-hosts": true,
    "use-system-hosts": true,
    "ipv6": false,
    "cache-algorithm": "arc",
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/15",
    "fake-ip-range6": "2001:2::1/48",
    "fake-ip-filter": [
      "rule-set:private",
      "rule-set:fakeip_filter",
      "rule-set:connectivity_check",
      "rule-set:googlefcm",
      "rule-set:cn"
    ],
    "direct-nameserver-follow-policy": true,
    "direct-nameserver": [
      "223.5.5.5#DIRECT",
      "119.29.29.29#DIRECT"
    ],
    "default-nameserver": [
      "114.114.114.114#DIRECT",
      "tls://223.5.5.5#DIRECT",
      "https://1.12.12.12/dns-query#DIRECT"
    ],
    "nameserver": [
      "https://cloudflare-dns.com/dns-query#Default",
      "https://dns.google/dns-query#Default"
    ],
    "nameserver-policy": {
      "rule-set:private": "system",
      "rule-set:ai": [
        "https://cloudflare-dns.com/dns-query#AI",
        "https://dns.google/dns-query#AI"
      ],
      "rule-set:douyin": [
        "180.184.1.1#DIRECT",
        "180.184.2.2#DIRECT"
      ],
      "rule-set:cn": [
        "223.5.5.5#DIRECT",
        "119.29.29.29#DIRECT"
      ]
    },
    "proxy-server-nameserver": [
      "114.114.114.114#DIRECT",
      "tls://223.5.5.5#DIRECT",
      "https://doh.pub/dns-query#DIRECT"
    ]
  },
  "hosts": {
    "doh.pub": [
      "1.12.12.12",
      "120.53.53.53"
    ],
    "dns.google": [
      "8.8.8.8",
      "8.8.4.4"
    ],
    "cloudflare-dns.com": [
      "1.1.1.1",
      "1.0.0.1"
    ],
    "services.googleapis.cn": "services.googleapis.com",
    "+.mcdn.bilivideo.com": [
      "0.0.0.0"
    ],
    "+.mcdn.bilivideo.cn": [
      "0.0.0.0"
    ],
    "+.h2.smtcdns.net": [
      "0.0.0.0"
    ],
    "+.edge.mountaintoys.cn": [
      "0.0.0.0"
    ]
  },
  "profile": {
    "store-selected": true,
    "store-fake-ip": true,
    "disconnect-on-policy-change": true
  },
  "ntp": {
    "enable": true,
    "write-to-system": false,
    "server": "ntp.aliyun.com",
    "port": 123,
    "interval": 60
  },
  "tun": {
    "enable": true,
    "auto-route": true,
    "auto-redirect": true,
    "auto-detect-interface": true,
    "stack": "mips",
    "dns-hijack": [
      "any:53",
      "tcp://any:53"
    ]
  }
};

const autoOption = {
  "lazy": true,
  "hidden": true,
  "include-all": true,
  "max-failed-times": 2,
  "interval": 1200,
  "timeout": 3000,
  "tolerance": 80,
  "type": "url-test",
  "empty-fallback": "REJECT",
  "exclude-type": "DIRECT|REJECT|Hysteria2",
  "url": "http://g.cn/generate_204",
  "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Auto.svg"
};
const manualOption = {
  "include-all": true,
  "interval": 1200,
  "timeout": 3000,
  "type": "select",
  "empty-fallback": "REJECT",
  "exclude-type": "REJECT",
  "url": "http://g.cn/generate_204"
};
const autoExclude = "(?i)(vpn|卖|版本|泄露|剩余|到期|过期|重置|流量|套餐|订阅|官网|网址|网站|客服|工单|群组|频道|通知|超时|备用|直连|下载|(?<!\\d)0\\.[0-5]|(?:https?:\\/\\/|\\.com|\\.org|\\.net|@|⚠️))";
const manualExclude = "(?i)(vpn|卖|版本|泄露|剩余|到期|过期|重置|流量|套餐|订阅|官网|网址|网站|客服|工单|群组|频道|通知|超时|备用|(?:https?:\\/\\/|\\.com|\\.org|\\.net|@|⚠️))";

// 保留 YAML 的业务组、拦截开关与家宽组，地区组运行时生成。
const baseOption = {"interval": 1200, "timeout": 3000, "type": "select", "empty-fallback": "REJECT", "url": "http://g.cn/generate_204"};
const businessOption = { ...baseOption, proxies: ["Default", "Direct", "All Proxies", "Residential", "Hong Kong", "Taiwan", "Japan", "Singapore", "United States"] };

const groupTemplates = [
  { ...baseOption, "name": "GLOBAL", "proxies": ["Default", "Direct", "WebRTC", "QUIC", "AdBlock", "FCM", "Google", "AI", "GitHub", "Telegram", "Twitter", "TikTok", "Anime", "Media", "Final", "All Proxies", "ALL-Auto", "Residential", "RSD-Auto", "Hong Kong", "HKG-Auto", "Taiwan", "TWN-Auto", "Japan", "JPN-Auto", "Singapore", "SGP-Auto", "United States", "USA-Auto"], "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Global.svg" },
  { ...baseOption, "name": "Default", "proxies": ["All Proxies", "Residential", "Hong Kong", "Taiwan", "Japan", "Singapore", "United States"], "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Proxy.svg" },
  { ...baseOption, "name": "Direct", "proxies": ["🇨🇳 直连 | 双栈"], "hidden": true, "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Direct.svg" },
  { ...baseOption, "name": "WebRTC", "proxies": ["Reject", "Pass"], "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/WebRTC.svg" },
  { ...baseOption, "name": "QUIC", "proxies": ["Reject", "Pass"], "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Quic.svg" },
  { ...baseOption, "name": "AdBlock", "proxies": ["Reject", "Pass"], "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/AdBlock.svg" },
  { ...baseOption, "name": "Reject", "proxies": ["REJECT"], "hidden": true, "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Reject.svg" },
  { ...baseOption, "name": "Pass", "proxies": ["PASS"], "hidden": true, "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Static.svg" },
  { ...businessOption, "name": "FCM", "default-selected": "Direct", "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/FCM.svg" },
  { ...businessOption, "name": "Google", "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Google.svg" },
  { ...businessOption, "name": "AI", "default-selected": "Residential", "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/ChatGPT.svg" },
  { ...businessOption, "name": "GitHub", "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/GitHub.svg" },
  { ...businessOption, "name": "Telegram", "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Telegram.svg" },
  { ...businessOption, "name": "Twitter", "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Twitter.svg" },
  { ...businessOption, "name": "TikTok", "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/TikTok.svg" },
  { ...businessOption, "name": "Anime", "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Bahamut.svg" },
  { ...businessOption, "name": "Media", "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Media.svg" },
  { ...businessOption, "name": "Final", "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Final.svg" },
  { ...autoOption, "exclude-filter": "(?i)(vpn|卖|版本|泄露|剩余|到期|过期|重置|流量|套餐|订阅|官网|网址|网站|客服|工单|群组|频道|通知|超时|备用|直连|下载|(?<!\\d)0\\.[0-5]|(?:https?:\\/\\/|\\.com|\\.org|\\.net|@|⚠️))", "name": "ALL-Auto" },
  { ...manualOption, "exclude-filter": "(?i)(vpn|卖|版本|泄露|剩余|到期|过期|重置|流量|套餐|订阅|官网|网址|网站|客服|工单|群组|频道|通知|超时|备用|(?:https?:\\/\\/|\\.com|\\.org|\\.net|@|⚠️))", "name": "All Proxies", "proxies": ["ALL-Auto"], "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Available.svg" },
  { ...autoOption, "filter": "(?i)(🏠|🏡|家庭|家宽|住宅|HOME|ISP|HINET|HKT)", "exclude-filter": "(?i)(vpn|卖|版本|泄露|剩余|到期|过期|重置|流量|套餐|订阅|官网|网址|网站|客服|工单|群组|频道|通知|超时|备用|直连|下载|(?<!\\d)0\\.[0-5]|(?:https?:\\/\\/|\\.com|\\.org|\\.net|@|⚠️))", "name": "RSD-Auto" },
  { ...manualOption, "filter": "(?i)(🏠|🏡|家庭|家宽|住宅|HOME|ISP|HINET|HKT)", "exclude-filter": "(?i)(vpn|卖|版本|泄露|剩余|到期|过期|重置|流量|套餐|订阅|官网|网址|网站|客服|工单|群组|频道|通知|超时|备用|(?:https?:\\/\\/|\\.com|\\.org|\\.net|@|⚠️))", "name": "Residential", "proxies": ["RSD-Auto"], "icon": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/common/Home.svg" },
];

const ruleProviders = {
  "geolocation-!cn": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/geolocation-!cn.mrs", "path": "./ruleset/geolocation-!cn.mrs", "path-in-bundle": "geo/geosite/geolocation-!cn.mrs"},
  "steam": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/steam.mrs", "path": "./ruleset/steam.mrs", "path-in-bundle": "geo/geosite/steam.mrs"},
  "steam_ip": {"type": "http", "interval": 86400, "behavior": "ipcidr", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/steam.mrs", "path": "./ruleset/steam_ip.mrs", "path-in-bundle": "geo/geoip/steam.mrs"},
  "google": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/google.mrs", "path": "./ruleset/google.mrs", "path-in-bundle": "geo/geosite/google.mrs"},
  "google_ip": {"type": "http", "interval": 86400, "behavior": "ipcidr", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/google.mrs", "path": "./ruleset/google_ip.mrs", "path-in-bundle": "geo/geoip/google.mrs"},
  "googlefcm": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/googlefcm.mrs", "path": "./ruleset/googlefcm.mrs", "path-in-bundle": "geo/geosite/googlefcm.mrs"},
  "ai": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/category-ai-!cn.mrs", "path": "./ruleset/ai.mrs", "path-in-bundle": "geo/geosite/category-ai-!cn.mrs"},
  "ai_ip": {"type": "http", "interval": 86400, "behavior": "ipcidr", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/ai.mrs", "path": "./ruleset/ai_ip.mrs", "path-in-bundle": "geo/geoip/ai.mrs"},
  "twitter": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/twitter.mrs", "path": "./ruleset/twitter.mrs", "path-in-bundle": "geo/geosite/twitter.mrs"},
  "twitter_ip": {"type": "http", "interval": 86400, "behavior": "ipcidr", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/twitter.mrs", "path": "./ruleset/twitter_ip.mrs", "path-in-bundle": "geo/geoip/twitter.mrs"},
  "telegram": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/telegram.mrs", "path": "./ruleset/telegram.mrs", "path-in-bundle": "geo/geosite/telegram.mrs"},
  "telegram_ip": {"type": "http", "interval": 86400, "behavior": "ipcidr", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/telegram.mrs", "path": "./ruleset/telegram_ip.mrs", "path-in-bundle": "geo/geoip/telegram.mrs"},
  "github": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/github.mrs", "path": "./ruleset/github.mrs", "path-in-bundle": "geo/geosite/github.mrs"},
  "anime_site": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/anime.mrs", "path": "./ruleset/anime_site.mrs", "path-in-bundle": "geo/geosite/anime.mrs"},
  "bangumi": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/bangumi.mrs", "path": "./ruleset/bangumi.mrs", "path-in-bundle": "geo/geosite/bangumi.mrs"},
  "bahamut": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/bahamut.mrs", "path": "./ruleset/bahamut.mrs", "path-in-bundle": "geo/geosite/bahamut.mrs"},
  "niconico": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/niconico.mrs", "path": "./ruleset/niconico.mrs", "path-in-bundle": "geo/geosite/niconico.mrs"},
  "tiktok": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/tiktok.mrs", "path": "./ruleset/tiktok.mrs", "path-in-bundle": "geo/geosite/tiktok.mrs"},
  "tiktok_ip": {"type": "http", "interval": 86400, "behavior": "ipcidr", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/tiktok.mrs", "path": "./ruleset/tiktok_ip.mrs", "path-in-bundle": "geo/geoip/tiktok.mrs"},
  "netflix": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/netflix.mrs", "path": "./ruleset/netflix.mrs", "path-in-bundle": "geo/geosite/netflix.mrs"},
  "netflix_ip": {"type": "http", "interval": 86400, "behavior": "ipcidr", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/netflix.mrs", "path": "./ruleset/netflix_ip.mrs", "path-in-bundle": "geo/geoip/netflix.mrs"},
  "hbo": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/hbo.mrs", "path": "./ruleset/hbo.mrs", "path-in-bundle": "geo/geosite/hbo.mrs"},
  "disney": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/disney.mrs", "path": "./ruleset/disney.mrs", "path-in-bundle": "geo/geosite/disney.mrs"},
  "emby": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/category-emby.mrs", "path": "./ruleset/emby.mrs", "path-in-bundle": "geo/geosite/category-emby.mrs"},
  "emos": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/binaryu/emos-proxy-rule@main/rules/emos-mihomo.mrs", "path": "./ruleset/emos.mrs", "path-in-bundle": "geo/geosite/category-emby.mrs"},
  "youtube": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/youtube.mrs", "path": "./ruleset/youtube.mrs", "path-in-bundle": "geo/geosite/youtube.mrs"},
  "twitch": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/twitch.mrs", "path": "./ruleset/twitch.mrs", "path-in-bundle": "geo/geosite/twitch.mrs"},
  "category_porn": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/category-porn.mrs", "path": "./ruleset/category_porn.mrs", "path-in-bundle": "geo/geosite/category-porn.mrs"},
  "private": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/private.mrs", "path": "./ruleset/private.mrs", "path-in-bundle": "geo/geosite/private.mrs"},
  "private_ip": {"type": "http", "interval": 86400, "behavior": "ipcidr", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/private.mrs", "path": "./ruleset/private_ip.mrs", "path-in-bundle": "geo/geoip/private.mrs"},
  "geolocation-cn": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/geolocation-cn.mrs", "path": "./ruleset/geolocation-cn.mrs", "path-in-bundle": "geo/geosite/geolocation-cn.mrs"},
  "cn": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/cn.mrs", "path": "./ruleset/cn.mrs", "path-in-bundle": "geo/geosite/cn.mrs"},
  "cn_ip": {"type": "http", "interval": 86400, "behavior": "ipcidr", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/cn.mrs", "path": "./ruleset/cn_ip.mrs", "path-in-bundle": "geo/geoip/cn.mrs"},
  "games_cn": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/category-games@cn.mrs", "path": "./ruleset/category-games@cn.mrs", "path-in-bundle": "geo/geosite/category-games@cn.mrs"},
  "apple_cn": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/apple@cn.mrs", "path": "./ruleset/apple@cn.mrs", "path-in-bundle": "geo/geosite/apple@cn.mrs"},
  "microsoft_cn": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/microsoft@cn.mrs", "path": "./ruleset/microsoft@cn.mrs", "path-in-bundle": "geo/geosite/microsoft@cn.mrs"},
  "nvidia_cn": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/nvidia@cn.mrs", "path": "./ruleset/nvidia@cn.mrs", "path-in-bundle": "geo/geosite/nvidia@cn.mrs"},
  "douyin": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/douyin.mrs", "path": "./ruleset/douyin.mrs", "path-in-bundle": "geo/geosite/douyin.mrs"},
  "fakeip_filter": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/fakeip-filter.mrs", "path": "./ruleset/fakeip-filter.mrs", "path-in-bundle": "geo/geosite/fakeip-filter.mrs"},
  "connectivity_check": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://raw.githubusercontent.com/appshubcc/bett-rules/meta/geo/geosite/connectivity-check.mrs", "path": "./ruleset/connectivity-check.mrs", "path-in-bundle": "geo/geosite/connectivity-check.mrs"},
  "category-ads-all": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/category-ads-all.mrs", "path": "./ruleset/category-ads-all.mrs", "path-in-bundle": "geo/geosite/category-ads-all.mrs"},
  "AWAvenue-Ads-Rule": {"type": "http", "interval": 86400, "behavior": "domain", "format": "mrs", "url": "https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/Filters/AWAvenue-Ads-Rule-Clash.mrs", "path": "./ruleset/AWAvenue-Ads-Rule.mrs"},
  "anime": {"type": "http", "interval": 86400, "behavior": "classical", "format": "yaml", "url": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/rules/anime.yaml", "path": "./ruleset/anime.yaml"},
  "media": {"type": "http", "interval": 86400, "behavior": "classical", "format": "yaml", "url": "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/rules/media.yaml", "path": "./ruleset/media.yaml"},
};

const rules = [
  "RULE-SET,private,Direct",
  "RULE-SET,category-ads-all,AdBlock",
  "RULE-SET,AWAvenue-Ads-Rule,AdBlock",
  "DOMAIN,msmp.abchina.com.cn,REJECT",
  "AND,((NETWORK,UDP),(DST-PORT,3478/19302)),WebRTC",
  "AND,((NETWORK,UDP),(DST-PORT,443),(NOT,((OR,((RULE-SET,cn),(RULE-SET,cn_ip,no-resolve)))))),QUIC",
  "RULE-SET,geolocation-cn,Direct",
  "RULE-SET,games_cn,Direct",
  "RULE-SET,nvidia_cn,Direct",
  "RULE-SET,apple_cn,Direct",
  "RULE-SET,microsoft_cn,Direct",
  "DOMAIN,fsend.cn,Direct",
  "DOMAIN,international-gfe.download.nvidia.com,Direct",
  "DOMAIN-SUFFIX,ctaiot.com,Direct",
  "DOMAIN,cdn.jsdmirror.com,Direct",
  "RULE-SET,emos,Direct",
  "RULE-SET,niconico,JPN-Auto",
  "RULE-SET,googlefcm,FCM",
  "RULE-SET,github,GitHub",
  "RULE-SET,telegram,Telegram",
  "RULE-SET,twitter,Twitter",
  "RULE-SET,tiktok,TikTok",
  "RULE-SET,anime,Anime",
  "RULE-SET,anime_site,Anime",
  "RULE-SET,bangumi,Anime",
  "RULE-SET,bahamut,Anime",
  "RULE-SET,media,Media",
  "RULE-SET,category_porn,Media",
  "RULE-SET,twitch,Media",
  "RULE-SET,youtube,Media",
  "RULE-SET,hbo,Media",
  "RULE-SET,disney,Media",
  "RULE-SET,emby,Media",
  "RULE-SET,netflix,Media",
  "RULE-SET,google,Google",
  "RULE-SET,ai,AI",
  "DOMAIN,cdn.usefathom.com,AI",
  "DOMAIN-SUFFIX,intercom.io,AI",
  "DOMAIN-SUFFIX,intercomcdn.com,AI",
  "RULE-SET,steam,Default",
  "RULE-SET,geolocation-!cn,Default",
  "RULE-SET,telegram_ip,Telegram",
  "RULE-SET,twitter_ip,Twitter",
  "RULE-SET,tiktok_ip,TikTok",
  "RULE-SET,netflix_ip,Media",
  "RULE-SET,google_ip,Google",
  "RULE-SET,ai_ip,AI",
  "RULE-SET,steam_ip,Default",
  "RULE-SET,cn_ip,Direct",
  "RULE-SET,private_ip,Direct",
  "MATCH,Final",
];

const commonDnsList = [
  // ==================== 国内 ====================

  // 阿里 AliDNS（阿里云）
  '223.5.5.5',
  '223.6.6.6',
  '2400:3200::1',
  '2400:3200:baba::1',
  'alidns',

  // 腾讯 DNSPod（腾讯云）
  '119.29.29.29',
  '119.28.28.28',
  '182.254.116.116',
  '182.254.118.118',
  '1.12.12.12',
  '120.53.53.53',
  '2402:4e00::',
  'doh.pub',
  'dot.pub',
  'dns.pub',
  'dnspod',

  // 114DNS（南京信风）
  '114.114.114.114',
  '114.114.115.115',
  '114.114.114.119',
  '114.114.115.119',
  '114.114.114.110',
  '114.114.115.110',

  // 百度 BaiduDNS
  '180.76.76.76',
  '2400:da00::6666',
  'dns.baidu',

  // CNNIC SDNS（中国互联网络信息中心）
  '1.2.4.8',
  '210.2.4.8',
  '2001:dc7:1000::1',
  'cnnic',

  // 360 安全 DNS
  '101.226.4.6',
  '218.30.118.6',
  '123.125.81.6',
  '140.207.198.6',
  '2400:8800:1::6',
  '2400:8800:2::6',
  'doh.360',
  'dot.360',
  'dns.360',

  // 火山引擎（字节跳动）
  '180.184.1.1',
  '180.184.2.2',

  // OneDNS（微步在线，拦截版/纯净版/家庭版）
  '117.50.11.11',
  '117.50.22.22',
  '52.80.66.66',
  '117.50.10.10',
  '52.80.52.52',
  '117.50.60.30',
  '52.80.60.30',
  'onedns.net',

  // 清华大学 TUNA
  '101.6.6.6',
  '2001:da8::666',

  // 下一代互联网国家工程中心（IPv6 公共 DNS）
  '240c::6666',
  '240c::6644',

  // 中国科学技术大学（教育网防污染）
  '202.141.162.123',
  '202.141.178.13',

  // ==================== 国外 ====================

  // Cloudflare
  '1.1.1.1',
  '1.0.0.1',
  '1.1.1.2',
  '1.0.0.2',
  '1.1.1.3',
  '1.0.0.3',
  '2606:4700:4700::1111',
  '2606:4700:4700::1001',
  '2606:4700:4700::1112',
  '2606:4700:4700::1002',
  '2606:4700:4700::1113',
  '2606:4700:4700::1003',
  'dns.cloudflare',
  'cloudflare-dns',
  'one.one.one.one',

  // Google Public DNS
  '8.8.8.8',
  '8.8.4.4',
  '2001:4860:4860::8888',
  '2001:4860:4860::8844',
  'dns.google',

  // Quad9
  '9.9.9.9',
  '9.9.9.10',
  '9.9.9.11',
  '149.112.112.112',
  '149.112.112.10',
  '149.112.112.11',
  '2620:fe::fe',
  '2620:fe::9',
  'quad9',

  // Cisco OpenDNS（含 FamilyShield）
  '208.67.222.222',
  '208.67.220.220',
  '208.67.222.123',
  '208.67.220.123',
  '2620:119:35::35',
  '2620:119:53::53',
  '2620:119:35::123',
  '2620:119:53::123',
  'opendns',

  // AdGuard DNS（含家庭版）
  '94.140.14.14',
  '94.140.15.15',
  '94.140.14.15',
  '94.140.15.16',
  '2a10:50c0::ad1:ff',
  '2a10:50c0::ad2:ff',
  '2a10:50c0::bad1:ff',
  '2a10:50c0::bad2:ff',
  'adguard',

  // Control D
  '76.76.2.0',
  '76.76.10.0',
  '76.76.19.19',
  '76.223.122.150',

  // CleanBrowsing（含安全/家庭版）
  '185.228.168.9',
  '185.228.169.9',
  '185.228.168.10',
  '185.228.169.11',
  '185.228.168.168',
  '185.228.169.168',
  '2a0d:2a00:1::2',
  '2a0d:2a00:2::2',

  // Yandex DNS
  '77.88.8.8',
  '77.88.8.1',
  '2a02:6b8::feed:0ff',
  '2a02:6b8:0:1::feed:0ff',

  // Neustar UltraDNS
  '156.154.70.1',
  '156.154.71.1',
  '156.154.70.2',
  '156.154.71.2',
  '2610:a1:1018::1',
  '2610:a1:1019::1',

  // Mullvad DNS
  '194.242.2.2',
  '2a07:e340::2',

  // Hurricane Electric
  '74.82.42.42',
  '2001:470:20::2',

  // NextDNS
  'nextdns',

  // Apple
  'dns.apple',
];



function hostSpecificity(pattern) {
  if (pattern.startsWith('+.')) return 2;
  if (pattern.startsWith('.')) return 1;
  if (pattern.includes('*')) return 0;
  return 3;
}

function matchDomainPattern(pattern, domains) {
  pattern = pattern.toLowerCase();
  if (!pattern.includes('*') && !pattern.startsWith('+.') && !pattern.startsWith('.')) {
    return typeof domains === 'string'
      ? domains.toLowerCase() === pattern
      : [...domains].some((d) => d.toLowerCase() === pattern);
  }

  const domainList = typeof domains === 'string' ? [domains.toLowerCase()] : [...domains].map((d) => d.toLowerCase());

  if (pattern.startsWith('+.')) {
    const suffix = pattern.slice(2);
    return domainList.some((domain) => domain === suffix || domain.endsWith(`.${suffix}`));
  }

  if (pattern.startsWith('.')) {
    const suffix = pattern.slice(1);
    return domainList.some((domain) => domain !== suffix && domain.endsWith(`.${suffix}`));
  }

  const patternParts = pattern.split('.');
  return domainList.some((domain) => {
    const domainParts = domain.split('.');
    return (
      patternParts.length === domainParts.length &&
      patternParts.every((part, index) => part === '*' || part === domainParts[index])
    );
  });
}

function applyHostsToProxies(proxies, hosts) {
  if (!hosts || typeof hosts !== 'object') return proxies;

  const hostEntries = Object.entries(hosts)
    .filter(([, value]) => (typeof value === 'string' && value.length > 0) || (Array.isArray(value) && value.length > 0))
    .sort((a, b) => hostSpecificity(b[0]) - hostSpecificity(a[0]));

  if (hostEntries.length === 0) return proxies;

  const targetOf = (value) => {
    if (Array.isArray(value)) value = value.find((v) => typeof v === 'string' && v.length > 0);
    return typeof value === 'string' && value.length > 0 ? value : null;
  };

  const resolveCache = new Map();
  const resolve = (server) => {
    const cached = resolveCache.get(server);
    if (cached !== undefined) return cached;

    const seen = new Set();
    let current = server.toLowerCase();
    let result = server;
    while (!seen.has(current)) {
      seen.add(current);
      const entry = hostEntries.find(([pattern]) => matchDomainPattern(pattern, current));
      const target = entry && targetOf(entry[1]);
      if (!target) break;
      result = target;
      current = target.toLowerCase();
    }
    resolveCache.set(server, result);
    return result;
  };

  return proxies.map((proxy) => {
    if (typeof proxy.server !== 'string') return proxy;
    const server = resolve(proxy.server);
    return server === proxy.server ? proxy : { ...proxy, server };
  });
}

// 去掉订阅中已不存在的策略组后缀，直连标记统一使用内置 DIRECT。
function stripDnsSuffix(value) {
  if (typeof value !== 'string') return '';
  const [address, suffix = ''] = value.trim().split('#');
  return address.trim() + (/^(?:direct|直连)(?:&|$)/i.test(suffix.trim()) ? '#DIRECT' : '');
}

function isIpAddress(server) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(server) || server.includes(':');
}

function isCommonDns(value) {
  // 比较解析器主机，避免把 11.1.1.1 或私有 DoH 路径误判成公共 DNS。
  let host = value.split('#')[0].replace(/^[a-z][\w+.-]*:\/\//i, '').split(/[/?]/)[0].toLowerCase();
  if (host.startsWith('[')) host = host.slice(1, host.indexOf(']'));
  else if (host.indexOf(':') === host.lastIndexOf(':')) host = host.replace(/:\d+$/, '');
  return host === 'system' || host === 'localhost' || host === '127.0.0.1' || host === '::1' ||
    commonDnsList.some((entry) => isIpAddress(entry) ? host === entry :
      host === entry || host.endsWith('.' + entry) || host.startsWith(entry + '.'));
}

function buildDnsAndHostsConfig(config, proxies) {
  const original = config.dns || {};
  const proxyNameservers = asList(original['proxy-server-nameserver']);
  const listen = typeof original.listen === 'string' ? original.listen.toLowerCase() : '';
  const rewriteHosts = proxyNameservers.length === 1 && listen.length > 0 &&
    (String(proxyNameservers[0]).toLowerCase().includes(listen) ||
      (listen.includes('0.0.0.0') && String(proxyNameservers[0]).includes('127.0.0.1')));
  const mappedProxies = rewriteHosts ? applyHostsToProxies(proxies, config.hosts) : proxies;
  const domains = new Set(mappedProxies.map((proxy) => proxy.server)
    .filter((server) => typeof server === 'string' && !isIpAddress(server))
    .map((server) => server.toLowerCase()));
  const privateDNS = [...new Set([
    ...asList(original.nameserver), ...(rewriteHosts ? [] : proxyNameservers),
  ].map(stripDnsSuffix).filter((dns) => dns && !isCommonDns(dns)))];

  const hasProviders = Object.keys(config['proxy-providers'] || {}).length > 0;
  const proxyPolicy = {};
  for (const [pattern, servers] of Object.entries({
    ...original['nameserver-policy'], ...original['proxy-server-nameserver-policy'],
  })) {
    if (/^(rule-set|geosite|geoip):/i.test(pattern)) continue;
    if (!hasProviders && !matchDomainPattern(pattern, domains)) continue;
    const cleaned = [...new Set(asList(servers).map(stripDnsSuffix).filter(Boolean))];
    if (cleaned.length) proxyPolicy[pattern] = cleaned;
  }
  // 显式策略优先；私有 DNS 只补齐尚未被策略覆盖的节点。
  if (privateDNS.length) {
    for (const domain of domains) {
      if (!Object.keys(proxyPolicy).some((pattern) => matchDomainPattern(pattern, domain))) {
        proxyPolicy[domain] = [...privateDNS];
      }
    }
  }

  const dns = clone(baseConfig.dns);
  dns['fake-ip-filter'] = [...new Set([
    ...dns['fake-ip-filter'],
    ...asList(original['fake-ip-filter']).filter((pattern) =>
      typeof pattern === 'string' && matchDomainPattern(pattern, domains)),
  ])];
  if (Object.keys(proxyPolicy).length) dns['proxy-server-nameserver-policy'] = proxyPolicy;
  // provider 内部节点尚不可见时，用订阅私有 DNS 解析，保留公共 DNS 作为后备。
  if (hasProviders && privateDNS.length) {
    dns['proxy-server-nameserver'] = [...privateDNS, ...dns['proxy-server-nameserver']];
  }
  const hosts = { ...(config.hosts || {}), ...clone(baseConfig.hosts) };
  return { dns, hosts, proxies: mappedProxies };
}

function region(name, code, flag, pattern, icon = name.replace(/ /g, '_')) {
  return { name, code, regex: new RegExp(`${flag}|${pattern}`, 'i'), icon: `${ICON_BASE}flag/${icon}.svg` };
}

// 常见机场地区。保留现有 SVG 文件，不为偏远属地等扩展匹配表。
const regionDefinitions = [
  region('Hong Kong', 'HKG', '🇭🇰', '香港|(?<![A-Za-z])HKG?(?![A-Za-z])|hong\\s*kong'),
  region('Taiwan', 'TWN', '🇹🇼', '台湾|台灣|台北|高雄|(?<![A-Za-z])TWN?(?![A-Za-z])|taiwan', 'China_Taiwan'),
  region('Japan', 'JPN', '🇯🇵', '日本|东京|東京|大阪|(?<![A-Za-z])JPN?(?![A-Za-z])|japan'),
  region('Singapore', 'SGP', '🇸🇬', '新加坡|狮城|獅城|(?<![A-Za-z])SGP?(?![A-Za-z])|singapore'),
  region('United States', 'USA', '🇺🇸', '美国|美國|洛杉矶|洛杉磯|纽约|紐約|西雅图|(?<![A-Za-z])USA?(?![A-Za-z])|united\\s*states|america'),
  region('Macau', 'MAC', '🇲🇴', '澳门|澳門|(?<![A-Za-z])(?:MO|MAC)(?![A-Za-z])|maca[ou]'),
  region('South Korea', 'KOR', '🇰🇷', '韩国|韓國|首尔|首爾|(?<![A-Za-z])KOR?(?![A-Za-z])|(?:south\\s*)?korea'),
  region('Malaysia', 'MYS', '🇲🇾', '马来西亚|馬來西亞|大马|(?<![A-Za-z])MYS?(?![A-Za-z])|malaysia'),
  region('Thailand', 'THA', '🇹🇭', '泰国|泰國|曼谷|(?<![A-Za-z])THA?(?![A-Za-z])|thailand'),
  region('Vietnam', 'VNM', '🇻🇳', '越南|(?<![A-Za-z])VNM?(?![A-Za-z])|viet\\s*nam'),
  region('Philippines', 'PHL', '🇵🇭', '菲律宾|菲律賓|(?<![A-Za-z])PHL?(?![A-Za-z])|philippines'),
  region('Indonesia', 'IDN', '🇮🇩', '印度尼西亚|印尼|(?<![A-Za-z])IDN?(?![A-Za-z])|indonesia'),
  region('India', 'IND', '🇮🇳', '印度(?!尼)|(?<![A-Za-z])IND?(?![A-Za-z])|india(?![a-z])'),
  region('Pakistan', 'PAK', '🇵🇰', '巴基斯坦|(?<![A-Za-z])PA?K(?![A-Za-z])|pakistan'),
  region('Bangladesh', 'BGD', '🇧🇩', '孟加拉|(?<![A-Za-z])B(?:D|GD)(?![A-Za-z])|bangladesh'),
  region('United Kingdom', 'GBR', '🇬🇧', '英国|英國|伦敦|倫敦|(?<![A-Za-z])(?:UK|GBR?)(?![A-Za-z])|united\\s*kingdom|britain'),
  region('Germany', 'DEU', '🇩🇪', '德国|德國|法兰克福|法蘭克福|(?<![A-Za-z])DEU?(?![A-Za-z])|germany'),
  region('France', 'FRA', '🇫🇷', '法国|法國|巴黎|(?<![A-Za-z])FRA?(?![A-Za-z])|france'),
  region('Netherlands', 'NLD', '🇳🇱', '荷兰|荷蘭|阿姆斯特丹|(?<![A-Za-z])NLD?(?![A-Za-z])|netherlands'),
  region('Switzerland', 'CHE', '🇨🇭', '瑞士|(?<![A-Za-z])CH(?:E)?(?![A-Za-z])|switzerland'),
  region('Sweden', 'SWE', '🇸🇪', '瑞典|(?<![A-Za-z])SWE?(?![A-Za-z])|sweden'),
  region('Norway', 'NOR', '🇳🇴', '挪威|(?<![A-Za-z])NOR?(?![A-Za-z])|norway'),
  region('Finland', 'FIN', '🇫🇮', '芬兰|芬蘭|(?<![A-Za-z])FIN?(?![A-Za-z])|finland'),
  region('Denmark', 'DNK', '🇩🇰', '丹麦|丹麥|(?<![A-Za-z])D(?:K|NK)(?![A-Za-z])|denmark'),
  region('Ireland', 'IRL', '🇮🇪', '爱尔兰|愛爾蘭|(?<![A-Za-z])I(?:E|RL)(?![A-Za-z])|ireland'),
  region('Italy', 'ITA', '🇮🇹', '意大利|義大利|(?<![A-Za-z])ITA?(?![A-Za-z])|italy'),
  region('Spain', 'ESP', '🇪🇸', '西班牙|(?<![A-Za-z])ES(?:P)?(?![A-Za-z])|spain'),
  region('Portugal', 'PRT', '🇵🇹', '葡萄牙|(?<![A-Za-z])P(?:T|RT)(?![A-Za-z])|portugal'),
  region('Austria', 'AUT', '🇦🇹', '奥地利|奧地利|(?<![A-Za-z])A(?:T|UT)(?![A-Za-z])|austria'),
  region('Belgium', 'BEL', '🇧🇪', '比利时|比利時|(?<![A-Za-z])BEL?(?![A-Za-z])|belgium'),
  region('Poland', 'POL', '🇵🇱', '波兰|波蘭|(?<![A-Za-z])P(?:L|OL)(?![A-Za-z])|poland'),
  region('Czechia', 'CZE', '🇨🇿', '捷克|(?<![A-Za-z])CZE?(?![A-Za-z])|czech(?:ia|\\s*republic)?'),
  region('Hungary', 'HUN', '🇭🇺', '匈牙利|(?<![A-Za-z])HUN?(?![A-Za-z])|hungary'),
  region('Romania', 'ROU', '🇷🇴', '罗马尼亚|羅馬尼亞|(?<![A-Za-z])ROU?(?![A-Za-z])|romania'),
  region('Bulgaria', 'BGR', '🇧🇬', '保加利亚|保加利亞|(?<![A-Za-z])BGR?(?![A-Za-z])|bulgaria'),
  region('Greece', 'GRC', '🇬🇷', '希腊|希臘|(?<![A-Za-z])GR(?:C)?(?![A-Za-z])|greece'),
  region('Russia', 'RUS', '🇷🇺', '俄罗斯|俄羅斯|莫斯科|(?<![A-Za-z])RUS?(?![A-Za-z])|russia'),
  region('Ukraine', 'UKR', '🇺🇦', '乌克兰|烏克蘭|(?<![A-Za-z])U(?:A|KR)(?![A-Za-z])|ukraine'),
  region('Turkey', 'TUR', '🇹🇷', '土耳其|(?<![A-Za-z])T(?:R|UR)(?![A-Za-z])|turkey|türkiye'),
  region('Israel', 'ISR', '🇮🇱', '以色列|(?<![A-Za-z])I(?:L|SR)(?![A-Za-z])|israel'),
  region('United Arab Emirates', 'ARE', '🇦🇪', '阿联酋|阿聯酋|迪拜|杜拜|(?<![A-Za-z])(?:AE|ARE|UAE)(?![A-Za-z])|united\\s*arab\\s*emirates'),
  region('Saudi Arabia', 'SAU', '🇸🇦', '沙特|沙烏地|(?<![A-Za-z])SAU?(?![A-Za-z])|saudi\\s*arabia'),
  region('Australia', 'AUS', '🇦🇺', '澳大利亚|澳大利亞|澳洲|悉尼|雪梨|(?<![A-Za-z])AUS?(?![A-Za-z])|australia'),
  region('New Zealand', 'NZL', '🇳🇿', '新西兰|紐西蘭|(?<![A-Za-z])NZL?(?![A-Za-z])|new\\s*zealand'),
  region('Canada', 'CAN', '🇨🇦', '加拿大|(?<![A-Za-z])CAN?(?![A-Za-z])|canada'),
  region('Mexico', 'MEX', '🇲🇽', '墨西哥|(?<![A-Za-z])MEX?(?![A-Za-z])|mexico'),
  region('Brazil', 'BRA', '🇧🇷', '巴西|(?<![A-Za-z])BRA?(?![A-Za-z])|brazil'),
  region('Argentina', 'ARG', '🇦🇷', '阿根廷|(?<![A-Za-z])ARG?(?![A-Za-z])|argentina'),
  region('Chile', 'CHL', '🇨🇱', '智利|(?<![A-Za-z])C(?:L|HL)(?![A-Za-z])|chile'),
  region('South Africa', 'ZAF', '🇿🇦', '南非|(?<![A-Za-z])ZA(?:F)?(?![A-Za-z])|south\\s*africa'),
  region('Egypt', 'EGY', '🇪🇬', '埃及|(?<![A-Za-z])EGY?(?![A-Za-z])|egypt'),
];

function toMatchableName(name) {
  return name.normalize('NFKC').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '');
}

function nameRegex(pattern) {
  return new RegExp(pattern.replace(/\(\?i\)/g, ''), 'i');
}

function buildProxyGroups(proxies) {
  const excluded = nameRegex(manualExclude);
  const autoExcluded = nameRegex(autoExclude);
  const manualExcludedTypes = nameRegex(manualOption['exclude-type']);
  const autoExcludedTypes = nameRegex(autoOption['exclude-type']);
  // 生成门槛按手动可见节点计数；自动测速的排除条件不影响生成分组。
  const eligible = proxies.filter((proxy) =>
    !manualExcludedTypes.test(proxy.type || '') &&
    !excluded.test(toMatchableName(proxy.name)));
  const canAutoSelect = (proxy) => !autoExcludedTypes.test(proxy.type || '') &&
    !autoExcluded.test(toMatchableName(proxy.name));
  const regionGroups = [];
  for (const definition of regionDefinitions) {
    const nodes = eligible.filter((proxy) => definition.regex.test(toMatchableName(proxy.name)));
    if (nodes.length < MIN_REGION_NODES) continue;
    const autoName = `${definition.code}-Auto`;
    const autoNodes = nodes.filter(canAutoSelect);
    const automatic = {
      ...clone(autoOption), name: autoName,
      proxies: autoNodes.length ? autoNodes.map((proxy) => proxy.name) : ['REJECT'],
    };
    const manual = {
      ...clone(manualOption), name: definition.name,
      proxies: [autoName, ...nodes.map((proxy) => proxy.name)], icon: definition.icon,
    };
    // 显式成员保证分组成员与统计一致，不让 include-all 再加入其他地区。
    delete automatic['include-all'];
    delete manual['include-all'];
    regionGroups.push(automatic, manual);
  }

  const homeTemplate = groupTemplates.find((group) => group.name === 'Residential');
  const homePattern = nameRegex(homeTemplate.filter);
  const homeNodes = eligible.filter((proxy) => homePattern.test(toMatchableName(proxy.name)));
  const groups = clone(groupTemplates).filter((group) =>
    homeNodes.length > 0 || !['Residential', 'RSD-Auto'].includes(group.name));
  // 家宽只需一个手动可见节点；直连节点也计数并保留在手动组。
  if (homeNodes.length) {
    const autoHomeNodes = homeNodes.filter(canAutoSelect);
    const automatic = groups.find((group) => group.name === 'RSD-Auto');
    const manual = groups.find((group) => group.name === 'Residential');
    automatic.proxies = autoHomeNodes.length ? autoHomeNodes.map((proxy) => proxy.name) : ['REJECT'];
    manual.proxies = ['RSD-Auto', ...homeNodes.map((proxy) => proxy.name)];
    delete automatic['include-all'];
    delete manual['include-all'];
    delete automatic.filter;
    delete manual.filter;
  }
  const regionNames = regionGroups.filter((group) => group.type === 'select').map((group) => group.name);
  const available = new Set([...groups, ...regionGroups].map((group) => group.name));
  for (const proxy of proxies) available.add(proxy.name);
  available.add('🇨🇳 直连 | 双栈');
  for (const builtin of ['REJECT', 'PASS', 'DIRECT']) available.add(builtin);
  for (const group of groups) {
    if (!group.proxies) continue;
    const businessGroup = group.name === 'Default' || group.proxies.includes('Default');
    group.proxies = group.proxies.filter((name) => available.has(name));
    if (group.name === 'GLOBAL') group.proxies.push(...regionGroups.map((region) => region.name));
    else if (businessGroup) group.proxies.push(...regionNames);
    group.proxies = [...new Set(group.proxies)];
    if (group['default-selected'] && !group.proxies.includes(group['default-selected'])) {
      group['default-selected'] = group.proxies[0];
    }
  }
  return [...groups, ...regionGroups];
}

function main(config = {}) {
  const input = clone(config);
  const uniqueNodes = new Map();
  for (const proxy of asList(input.proxies)) {
    if (proxy && typeof proxy.name === 'string' && proxy.name && proxy.name !== '🇨🇳 直连 | 双栈') {
      if (!uniqueNodes.has(proxy.name)) uniqueNodes.set(proxy.name, proxy);
    }
  }
  const { dns, hosts, proxies } = buildDnsAndHostsConfig(input, [...uniqueNodes.values()]);
  const result = { ...clone(baseConfig), dns, hosts };
  result.proxies = [{ name: '🇨🇳 直连 | 双栈', type: 'direct' }, ...proxies];
  if (input['proxy-providers']) result['proxy-providers'] = input['proxy-providers'];
  result['proxy-groups'] = buildProxyGroups(proxies);
  result['rule-providers'] = clone(ruleProviders);
  const groupNames = new Set(result['proxy-groups'].map((group) => group.name));
  // 日本节点不足时，Niconico 规则使用默认出口；不保留不存在的测速组引用。
  result.rules = rules.map((rule) => rule.replace(/,JPN-Auto$/, groupNames.has('JPN-Auto') ? ',JPN-Auto' : ',Default'));
  return result;
}
