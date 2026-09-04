# 🚀 Mihomo / Clash Meta 分流配置 #

一个偏向 稳定、解耦、低维护成本 的 Mihomo / Clash Meta 配置项目。

本项目同时提供：

- 📝 YAML 配置：完整的 Mihomo / Clash Meta 分流配置，可直接使用或自行修改。
- ⚙️ JS 脚本：用于通过客户端的远程脚本 / URL 导入方式加载配置逻辑，方便快速部署。

---

✨ 配置核心

🗺️ 精准地域策略组

内置精细化的全球节点空间划分，采用 显式手动选择组 与 后台隐式延迟测速组（url-test） 动态联动机制。

后台自动测速组已剔除 Hysteria2 协议以及低倍率节点：

节点分组标签| 后台自动测速组
Residential 🏠| "RSD-Auto"
Hong Kong 🇭🇰| "HKG-Auto"
Taiwan Provience 🇨🇳| "TWN-Auto"
Japan 🇯🇵| "JPN-Auto"
Singapore 🇸🇬| "SGP-Auto"
United States 🇺🇸| "USA-Auto"
Rest of World 🌏| "ROW-Auto"

---

🧠 深度解耦

本配置的底层逻辑是：

«稳定 > 清晰 > 自动化»

针对日常高频使用的海内外主流服务配置了独立策略组，支持一键快速切换出口：

«🧩 "AI" · "TikTok" · "动漫" · "流媒体" »

特别针对二次元受众与流媒体场景，对相关策略组进行了合并与优化。

覆盖包括：

- 巴哈姆特
- Niconico
- Netflix
- YouTube
- Disney+
- Emby

同时在规则中手动附加了次元城动漫（cycani）、AGE动漫（agedm）等域名分流，以解决部分动漫网站屏蔽日本 IP 的问题。

---

🛡️ 广告拦截与防护

配置中集成轻量化的广告拦截规则集（"秋风广告规则集"），并独设 "广告净化" 核心控制策略组。

支持不同场景下的去广告需求：

- 直接拒绝：映射 "REJECT"
- 临时放行：映射 "PASS"

---

📂 YAML 配置与 JS 脚本

本项目提供两种使用方式，可根据客户端功能选择。

📝 方式一：使用 YAML 配置

YAML 是完整的 Mihomo / Clash Meta 配置文件。

你可以直接下载 YAML 文件，然后根据自己的需求修改。

使用前，需要在配置顶部的 "proxy-providers" 中填写自己的订阅链接：

proxy-providers:
  ①:
    <<: [*p, *global_exclude_filter]
    url: "填入订阅"     # 订阅1
    override:
      additional-prefix: "① "

  ②:
    <<: [*p, *global_exclude_filter]
    url: "填入订阅"     # 订阅2
    override:
      additional-prefix: "② "

通过 Provider 统一管理订阅源，策略组可以自动加载对应节点，并进行健康检查与测速。

---

⚙️ 方式二：通过 URL 导入 JS 脚本

如果你的客户端支持 JavaScript 远程脚本 / URL 脚本，可以直接使用下面的 Raw 地址导入：

"导入 mihomo.js 脚本" (https://reference-url-citation.invalid/0)

https://raw.githubusercontent.com/aaANDkk/ClashConfig/main/mihomo.js

«⚠️ 注意：请使用 "raw.githubusercontent.com" 地址，而不是 GitHub 文件页面的 "github.com/.../blob/..." 地址。»

JS 脚本适合不希望手动下载和修改文件的场景。

如果客户端不支持远程脚本 URL，需要自行复制粘贴所有js代码到代理客户端。

---

🔧 使用前配置

无论使用 YAML 还是 JS 脚本，都需要注意：

1. 准备自己的有效订阅链接
2. 在 "proxy-providers" 中填写订阅地址
3. 根据自己的网络环境调整 DNS、规则集和策略组
4. 如果使用 JS 脚本 URL 导入功能，请确认客户端支持远程 JavaScript 脚本功能

«本项目不会提供任何代理节点或机场订阅。»

---

⚠️ 声明与须知

- 本仓库为个人自用配置共享，不提供任何节点、不提供任何机场订阅服务。
- 使用前请自行在 "proxy-providers" 节点填写个人的有效订阅。
- 路由分流规则带有较强的个人开发者与追番使用习惯。
- 已内置 PCDN 域名屏蔽（如哔哩哔哩卡顿优化）与 QUIC 流量禁用规则。
- 可根据具体业务场景自行调整 "nameserver-policy" 与 "rules"。

---

📜 License

Configured under learning and communication purposes. All rights reserved.

💖 鸣谢

本项目在开发过程中参考了以下优秀开源项目：

- "AIsouler/MyClash" (https://github.com/AIsouler/MyClash)
