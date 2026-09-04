/**
 * 通用 Mihomo 预处理脚本
 * DNS 与 Hosts 逻辑：集成 AIsouler兼容方案
 */

// ==========================================
// 1. DNS 与 Hosts 处理核心（AIsouler 脚本适配逻辑）
// ==========================================

// 常见的公共 DNS，用于过滤订阅中的公共 DNS
const commonDnsList = [
  // IPv4（国内）
  '223.5.5.5', '223.6.6.6', '119.29.29.29', '1.12.12.12', '120.53.53.53',
  '114.114.114.114', '180.76.76.76', '1.2.4.8', '116.116.116.116',
  '101.226.4.6', '123.125.81.6', '180.184.1.1', '180.184.2.2',

  // IPv6（国内）
  '2400:3200::1', '2400:3200:baba::1', '2402:4e00::', '2400:da00::6666',

  // IPv4（国外）
  '1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4', '9.9.9.9', '149.112.112.112',
  '208.67.222.222', '208.67.220.220', '94.140.14.14', '94.140.15.15',
  '76.76.2.0', '76.76.10.0', '185.228.168.9', '185.228.169.9',
  '77.88.8.8', '77.88.8.1', '156.154.70.1', '156.154.71.1',

  // IPv6（国外）
  '2606:4700:4700::1111', '2606:4700:4700::1001', '2001:4860:4860::8888',
  '2001:4860:4860::8844', '2620:fe::fe', '2620:fe::9', '2620:119:35::35',
  '2620:119:53::53', '2a10:50c0::bad1:ff', '2a10:50c0::bad2:ff',
  '2a10:50c0::ad1:ff', '2a10:50c0::ad2:ff', '2a0d:2a00:1::2', '2a0d:2a00:2::2',
  '2a02:6b8::feed:0ff', '2a02:6b8:0:1::feed:0ff', '2610:a1:1018::1', '2610:a1:1019::1',

  // 关键词（国内）
  'alidns', 'doh.pub', 'dot.pub', 'dns.pub', 'dnspod', 'dns.baidu',

  // 关键词（国外）
  'dns.google', 'dns.cloudflare', 'cloudflare-dns', 'quad9', 'opendns', 'nextdns', 'adguard',
];

const commonDnsRegex = new RegExp(
  commonDnsList.map((dns) => dns.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i',
);

// 国内外基础 DNS 定义
const chinaDNS = ['223.5.5.5', '119.29.29.29'];
const chinaDohDNS = [
  'https://223.5.5.5/dns-query#Direct',
  'https://1.12.12.12/dns-query#Direct',
];
const foreignDNS = [
  'https://cloudflare-dns.com/dns-query#Default',
  'https://dns.google/dns-query#Default',
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

function stripDnsSuffix(dns) {
  const str = String(dns);
  const hashIndex = str.indexOf('#');
  if (hashIndex === -1) return str;

  const suffix = str.slice(hashIndex + 1).toLowerCase().trim();
  if (suffix === 'direct' || suffix.startsWith('direct&')) return str;

  return str.slice(0, hashIndex);
}

function isIpAddress(server) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(server) || server.includes(':');
}

function buildDnsAndHostsConfig(config, filteredProxies) {
  const originalDnsConfig = config.dns || {};
  const proxyServerNameservers = originalDnsConfig['proxy-server-nameserver'] || [];
  const listenValue = originalDnsConfig['listen'];

  // 判断是否需要根据订阅 hosts 映射节点 server（适配机场私有本地解析）
  const shouldRewriteByHosts =
    proxyServerNameservers.length === 1 &&
    typeof listenValue === 'string' &&
    listenValue.length > 0 &&
    (proxyServerNameservers.some((dns) => String(dns).toLowerCase().includes(listenValue.toLowerCase())) ||
      (listenValue.includes('0.0.0.0') && proxyServerNameservers.some((dns) => String(dns).toLowerCase().includes('127.0.0.1'))));

  const mappedProxies = shouldRewriteByHosts ? applyHostsToProxies(filteredProxies, config.hosts) : filteredProxies;

  const proxyDomains = new Set(
    mappedProxies
      .filter((proxy) => typeof proxy.server === 'string')
      .map((proxy) => proxy.server.toLowerCase())
      .filter((server) => !isIpAddress(server)),
  );

  const privateProxyServerNameservers = shouldRewriteByHosts ? [] : proxyServerNameservers;

  const isCommonDns = (dns) => {
    const value = String(dns).trim().toLowerCase();
    if (value === 'system' || value === 'system://') return true;
    return commonDnsRegex.test(value);
  };

  // 提取机场私有 DNS
  const privateDNS = [
    ...new Set(
      [...(originalDnsConfig['nameserver'] || []), ...privateProxyServerNameservers]
        .map(stripDnsSuffix)
        .filter((dns) => dns.length > 0 && !isCommonDns(dns)),
    ),
  ];

  const proxyServerPolicy = {};
  for (const [domain, dns] of Object.entries({
    ...originalDnsConfig['nameserver-policy'],
    ...originalDnsConfig['proxy-server-nameserver-policy'],
  })) {
    if (!matchDomainPattern(domain, proxyDomains)) continue;
    const value = Array.isArray(dns) ? dns.map(stripDnsSuffix).filter((d) => d.length > 0) : stripDnsSuffix(dns);
    if (Array.isArray(value) && value.length === 0) continue;
    proxyServerPolicy[domain] = value;
  }

  if (privateDNS.length > 0 && Object.keys(proxyServerPolicy).length === 0) {
    for (const domain of proxyDomains) {
      proxyServerPolicy[domain] = privateDNS;
    }
  }

  const originalFakeIpFilter = originalDnsConfig['fake-ip-filter'] || [];
  const proxyFakeIpFilter = originalFakeIpFilter.filter((pattern) => matchDomainPattern(String(pattern), proxyDomains));

  const dns = {
    enable: true,
    ipv6: false,
    'use-hosts': true,
    'use-system-hosts': true,
    'cache-algorithm': 'arc',
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/15',
    'fake-ip-range6': '2001:2::1/48',
    'fake-ip-filter': [
      'rule-set:private',
      'rule-set:fakeip_filter',
      'rule-set:geolocation-cn',
      ...proxyFakeIpFilter,
    ],
    'direct-nameserver': ['system', ...chinaDNS],
    'default-nameserver': chinaDohDNS,
    nameserver: foreignDNS,
    'nameserver-policy': {
      'rule-set:cn': chinaDNS,
    },
    'proxy-server-nameserver': chinaDohDNS,
    ...(Object.keys(proxyServerPolicy).length > 0 && {
      'proxy-server-nameserver-policy': proxyServerPolicy,
    }),
  };

  const hosts = {
    'cloudflare-dns.com': ['1.1.1.1', '1.0.0.1'],
    'dns.google': ['8.8.8.8', '8.8.4.4'],
    'services.googleapis.cn': 'services.googleapis.com',
    'google.cn': 'google.com',
    '+.mcdn.bilivideo.com': ['0.0.0.0'],
    '+.mcdn.bilivideo.cn': ['0.0.0.0'],
    '+.h2.smtcdns.net': ['0.0.0.0'],
    '+.edge.mountaintoys.cn': ['0.0.0.0'],
  };

  return { dns, hosts, proxies: mappedProxies };
}

// ==========================================
// 2. 策略组统一锚点与正则配置
// ==========================================

const autoOption = {
  type: 'url-test',
  'include-all': true,
  lazy: true,
  hidden: true,
  'max-failed-times': 3,
  interval: 1800,
  timeout: 3000,
  tolerance: 80,
  'exclude-type': 'Direct|Reject|Hysteria2',
  url: 'http://g.cn/generate_204',
  icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png',
};

const manualOption = {
  type: 'select',
  'include-all': true,
  timeout: 3000,
  'exclude-type': 'Direct|Reject',
  url: 'http://g.cn/generate_204',
};

// 排除正则
const autoExclude = '(?i)(卖|版本|泄露|剩余|到期|过期|重置|流量|套餐|订阅|官网|网址|网站|客服|工单|群组|频道|通知|超时|备用|下载|(?<!\\d)0\\.[0-5]|(?:https?:\\/\\/|\\.com|\\.org|\\.net|@|⚠️))';
const manualExclude = '(?i)(卖|版本|泄露|剩余|到期|过期|重置|流量|套餐|订阅|官网|网址|网站|客服|工单|群组|频道|通知|超时|(?:https?:\\/\\/|\\.com|\\.org|\\.net|@|⚠️))';

// 地区过滤正则
const filterHome = '(?i)(🏠|🏡|家庭|家宽|住宅|HOME|ISP|HINET|HKT)';
const filterHK = '(?i)(🇭🇰|香港|(?<![A-Za-z])HKG?(?![A-Za-z])|hong\\s*kong)';
const filterTW = '(?i)(🇹🇼|台湾|(?<![A-Za-z])TWN?(?![A-Za-z])|taiwan)';
const filterJP = '(?i)(🇯🇵|日本|(?<![A-Za-z])JPN?(?![A-Za-z])|japan)';
const filterSG = '(?i)(🇸🇬|新加坡|狮城|(?<![A-Za-z])SGP?(?![A-Za-z])|singapore)';
const filterUS = '(?i)(🇺🇸|美国|(?<![A-Za-z])USA?(?![A-Za-z])|america|united\\s*states)';
const filterOthers = '^(?!.*(?i)(🇭🇰|香港|(?<![A-Za-z])HKG?(?![A-Za-z])|hong\\s*kong|🇹🇼|台湾|(?<![A-Za-z])TWN?(?![A-Za-z])|taiwan|🇯🇵|日本|(?<![A-Za-z])JPN?(?![A-Za-z])|japan|🇸🇬|新加坡|狮城|(?<![A-Za-z])SGP?(?![A-Za-z])|singapore|🇺🇸|美国|(?<![A-Za-z])USA?(?![A-Za-z])|america|united\\s*states)).*$';

const standardGroupProxies = [
  'Default', 'Direct', 'All Proxies', 'Residential',
  'Hong Kong', 'Taiwan', 'Japan', 'Singapore', 'United States', 'Other Regions'
];

function buildProxyGroups() {
  return [
    // 默认组
    {
      name: 'Default',
      type: 'select',
      proxies: ['All Proxies', 'Residential', 'Hong Kong', 'Taiwan', 'Japan', 'Singapore', 'United States', 'Other Regions'],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png',
    },
    {
      name: 'Direct',
      type: 'select',
      proxies: ['🇨🇳 直连 | 双栈'],
      hidden: true,
      interval: 10800,
      url: 'http://connectivitycheck.platform.hicloud.com/generate_204',
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png',
    },

    // 拦截组
    {
      name: 'AdBlock',
      type: 'select',
      proxies: ['Reject', 'Pass'],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/AdBlack.png',
    },
    {
      name: 'Reject',
      type: 'select',
      proxies: ['REJECT'],
      hidden: true,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Reject.png',
    },
    {
      name: 'Pass',
      type: 'select',
      proxies: ['PASS'],
      hidden: true,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Static.png',
    },

    // 策略分组
    {
      name: 'Speedtest',
      type: 'select',
      proxies: standardGroupProxies,
      'default-selected': 'Direct',
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Speedtest(2).png',
    },
    {
      name: 'ChatGPT',
      type: 'select',
      proxies: standardGroupProxies,
      'default-selected': 'Residential',
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Chatgpt(2).png',
    },
    {
      name: 'Claude',
      type: 'select',
      proxies: standardGroupProxies,
      'default-selected': 'Residential',
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Claude.png',
    },
    {
      name: 'Gemini',
      type: 'select',
      proxies: standardGroupProxies,
      'default-selected': 'Residential',
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Gemini.png',
    },
    {
      name: 'TikTok',
      type: 'select',
      proxies: standardGroupProxies,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok_1.png',
    },
    {
      name: 'Anime',
      type: 'select',
      proxies: standardGroupProxies,
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Bahamut.png',
    },
    {
      name: 'Media',
      type: 'select',
      proxies: standardGroupProxies,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Media.png',
    },

    // 全部节点
    {
      ...autoOption,
      name: 'ALL-Auto',
      'exclude-filter': autoExclude,
    },
    {
      ...manualOption,
      name: 'All Proxies',
      'exclude-filter': manualExclude,
      proxies: ['ALL-Auto'],
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Available.png',
    },

    // 家宽
    {
      ...autoOption,
      name: 'RSD-Auto',
      filter: filterHome,
      'exclude-filter': autoExclude,
    },
    {
      ...manualOption,
      name: 'Residential',
      filter: filterHome,
      'exclude-filter': manualExclude,
      proxies: ['RSD-Auto'],
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Home.png',
    },

    // 香港
    {
      ...autoOption,
      name: 'HKG-Auto',
      filter: filterHK,
      'exclude-filter': autoExclude,
    },
    {
      ...manualOption,
      name: 'Hong Kong',
      filter: filterHK,
      'exclude-filter': manualExclude,
      proxies: ['HKG-Auto'],
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Hong_Kong(1).png',
    },

    // 台湾
    {
      ...autoOption,
      name: 'TWN-Auto',
      filter: filterTW,
      'exclude-filter': autoExclude,
    },
    {
      ...manualOption,
      name: 'Taiwan',
      filter: filterTW,
      'exclude-filter': manualExclude,
      proxies: ['TWN-Auto'],
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Taiwan(1).png',
    },

    // 日本
    {
      ...autoOption,
      name: 'JPN-Auto',
      filter: filterJP,
      'exclude-filter': autoExclude,
    },
    {
      ...manualOption,
      name: 'Japan',
      filter: filterJP,
      'exclude-filter': manualExclude,
      proxies: ['JPN-Auto'],
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Japan(1).png',
    },

    // 新加坡
    {
      ...autoOption,
      name: 'SGP-Auto',
      filter: filterSG,
      'exclude-filter': autoExclude,
    },
    {
      ...manualOption,
      name: 'Singapore',
      filter: filterSG,
      'exclude-filter': manualExclude,
      proxies: ['SGP-Auto'],
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Singapore(1).png',
    },

    // 美国
    {
      ...autoOption,
      name: 'USA-Auto',
      filter: filterUS,
      'exclude-filter': autoExclude,
    },
    {
      ...manualOption,
      name: 'United States',
      filter: filterUS,
      'exclude-filter': manualExclude,
      proxies: ['USA-Auto'],
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/United_States(1).png',
    },

    // 其他地区
    {
      ...autoOption,
      name: 'OTR-Auto',
      filter: filterOthers,
      'exclude-filter': autoExclude,
    },
    {
      ...manualOption,
      name: 'Other Regions',
      filter: filterOthers,
      'exclude-filter': manualExclude,
      proxies: ['OTR-Auto'],
      icon: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/Global.png',
    },
  ];
}

// ==========================================
// 3. 规则集合定义（Rule Providers）
// ==========================================

const domainProvider = (url, path) => ({ type: 'http', interval: 86400, behavior: 'domain', format: 'mrs', url, path });
const ipcidrProvider = (url, path) => ({ type: 'http', interval: 86400, behavior: 'ipcidr', format: 'mrs', url, path });

const ruleProviders = {
  // 基础
  private: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/private.mrs', './ruleset/private.mrs'),
  private_ip: ipcidrProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/private.mrs', './ruleset/private_ip.mrs'),
  fakeip_filter: domainProvider('https://fastly.jsdelivr.net/gh/wwqgtxx/clash-rules@release/fakeip-filter.mrs', './ruleset/fakeip-filter.mrs'),
  'geolocation-!cn': domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/geolocation-!cn.mrs', './ruleset/geolocation-!cn.mrs'),
  google: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/google.mrs', './ruleset/google.mrs'),
  google_ip: ipcidrProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/google.mrs', './ruleset/google_ip.mrs'),
  steam: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/steam.mrs', './ruleset/steam.mrs'),
  steam_asn: ipcidrProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/asn/AS32590.mrs', './ruleset/steam_asn.mrs'),
  speedtest: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/category-speedtest.mrs', './ruleset/speedtest.mrs'),
  'AWAvenue-Ads-Rule': domainProvider('https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/Filters/AWAvenue-Ads-Rule-Clash.mrs', './ruleset/AWAvenue-Ads-Rule.mrs'),

  // 人工智能
  openai: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/openai.mrs', './ruleset/openai.mrs'),
  openai_ip: ipcidrProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/openai.mrs', './ruleset/openai_ip.mrs'),
  anthropic: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/anthropic.mrs', './ruleset/anthropic.mrs'),
  gemini: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/google-gemini.mrs', './ruleset/gemini.mrs'),

  // 动漫
  anime: { type: 'http', interval: 86400, behavior: 'classical', format: 'yaml', url: 'https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/rules/anime.yaml', path: './ruleset/anime.yaml' },
  anime_site: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/anime.mrs', './ruleset/anime_site.mrs'),
  bangumi: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/bangumi.mrs', './ruleset/bangumi.mrs'),
  bahamut: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/bahamut.mrs', './ruleset/bahamut.mrs'),
  niconico: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/niconico.mrs', './ruleset/niconico.mrs'),

  // 视频与流媒体
  tiktok: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/tiktok.mrs', './ruleset/tiktok.mrs'),
  tiktok_ip: ipcidrProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/tiktok.mrs', './ruleset/tiktok_ip.mrs'),
  netflix: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/netflix.mrs', './ruleset/netflix.mrs'),
  netflix_ip: ipcidrProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/netflix.mrs', './ruleset/netflix_ip.mrs'),
  hbo: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/hbo.mrs', './ruleset/hbo.mrs'),
  disney: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/disney.mrs', './ruleset/disney.mrs'),
  emby: domainProvider('https://fastly.jsdelivr.net/gh/666OS/rules@release/mihomo/domain/Emby.mrs', './ruleset/emby.mrs'),
  youtube: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/youtube.mrs', './ruleset/youtube.mrs'),
  twitch: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/twitch.mrs', './ruleset/twitch.mrs'),
  category_porn: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/category-porn.mrs', './ruleset/category_porn.mrs'),

  // 国内直连规则集
  'geolocation-cn': domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/geolocation-cn.mrs', './ruleset/geolocation-cn.mrs'),
  cn: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/cn.mrs', './ruleset/cn.mrs'),
  cn_ip: ipcidrProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/cn.mrs', './ruleset/cn_ip.mrs'),
  epicgames: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/epicgames.mrs', './ruleset/epicgames.mrs'),
  games_cn: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/category-games@cn.mrs', './ruleset/category-games@cn.mrs'),
  apple_cn: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/apple@cn.mrs', './ruleset/apple@cn.mrs'),
  microsoft_cn: domainProvider('https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/microsoft@cn.mrs', './ruleset/microsoft@cn.mrs'),
};

// ==========================================
// 4. 分流规则定义（Rules）
// ==========================================

const rules = [
  // 优先直连
  'RULE-SET,private,Direct',
  'RULE-SET,games_cn,Direct',
  'RULE-SET,epicgames,Direct',
  'RULE-SET,apple_cn,Direct',
  'RULE-SET,microsoft_cn,Direct',
  'DOMAIN,fsend.cn,Direct',
  'DOMAIN,international-gfe.download.nvidia.com,Direct',

  // 特殊规则
  'DOMAIN,msmp.abchina.com.cn,REJECT',
  'AND,((NETWORK,UDP),(DST-PORT,443),(NOT,((OR,((RULE-SET,cn),(RULE-SET,cn_ip,no-resolve)))))),Reject',
  'RULE-SET,AWAvenue-Ads-Rule,AdBlock',
  'RULE-SET,niconico,JPN-Auto',
  'RULE-SET,bahamut,TWN-Auto',

  // 核心规则
  'RULE-SET,speedtest,Speedtest',
  'RULE-SET,openai,ChatGPT',
  'RULE-SET,openai_ip,ChatGPT,no-resolve',
  'RULE-SET,anthropic,Claude',
  'RULE-SET,gemini,Gemini',
  'RULE-SET,tiktok,TikTok',
  'RULE-SET,tiktok_ip,TikTok,no-resolve',
  'RULE-SET,anime,Anime',
  'RULE-SET,anime_site,Anime',
  'RULE-SET,bangumi,Anime',
  'RULE-SET,netflix,Media',
  'RULE-SET,netflix_ip,Media,no-resolve',
  'RULE-SET,category_porn,Media',
  'RULE-SET,twitch,Media',
  'RULE-SET,youtube,Media',
  'RULE-SET,hbo,Media',
  'RULE-SET,disney,Media',
  'RULE-SET,emby,Media',
  'DOMAIN-KEYWORD,emby,Media',
  'DOMAIN-KEYWORD,hanime,Media',
  'DOMAIN-KEYWORD,javchu,Media',

  // 兜底规则
  'RULE-SET,google,Default',
  'RULE-SET,google_ip,Default,no-resolve',
  'RULE-SET,steam,Default',
  'RULE-SET,steam_asn,Default,no-resolve',
  'RULE-SET,geolocation-!cn,Default',
  'RULE-SET,cn,Direct',
  'RULE-SET,cn_ip,Direct',
  'RULE-SET,private_ip,Direct',
  'MATCH,Default',
];

// ==========================================
// 5. 主入口函数（Main）
// ==========================================

function main(config) {
  const newConfig = {};

  // 1. 处理节点与 DNS/hosts（调用 A佬 算法识别并改写机场私有配置）
  const originalProxies = config.proxies || [];
  const { dns, hosts, proxies: mappedProxies } = buildDnsAndHostsConfig(config, originalProxies);

  newConfig['dns'] = dns;
  newConfig['hosts'] = hosts;

  // 2. 基础配置区域
  newConfig['ipv6'] = true;
  newConfig['allow-lan'] = true;
  newConfig['unified-delay'] = true;
  newConfig['etag-support'] = true;
  newConfig['tcp-concurrent'] = true;
  newConfig['reset-network-change'] = true;
  newConfig['auto-detect-interface'] = true;
  newConfig['udp-timeout'] = 30;
  newConfig['keep-alive-interval'] = 60;
  newConfig['bind-address'] = '*';
  newConfig['find-process-mode'] = 'strict';
  newConfig['mode'] = 'rule';
  newConfig['log-level'] = 'info';
  newConfig['external-controller'] = '127.0.0.1:9090';
  newConfig['external-ui'] = 'ui';
  newConfig['external-ui-url'] = 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip';

  newConfig['profile'] = {
    'store-selected': true,
    'store-fake-ip': true,
    'disconnect-on-policy-change': true,
  };

  newConfig['ntp'] = {
    enable: false,
    'write-to-system': false,
    server: 'ntp.aliyun.com',
    port: 123,
    interval: 60,
  };

  newConfig['tun'] = {
    enable: true,
    'auto-route': true,
    'auto-redirect': true,
    'auto-detect-interface': true,
    stack: 'mixed',
    'dns-hijack': ['any:53', 'tcp://any:53'],
  };

  // 3. 注入直连节点与订阅代理节点
  const directNode = { name: '🇨🇳 直连 | 双栈', type: 'direct' };
  newConfig['proxies'] = [directNode, ...mappedProxies];

  // 保留订阅中的 proxy-providers（若存在）
  if (config['proxy-providers']) {
    newConfig['proxy-providers'] = config['proxy-providers'];
  }

  // 4. 组装策略组、规则集与分流规则
  newConfig['proxy-groups'] = buildProxyGroups();
  newConfig['rule-providers'] = ruleProviders;
  newConfig['rules'] = rules;

  return newConfig;
}
