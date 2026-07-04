
# 🚀 Mihomo / Clash Meta 分流配置

一个深度调优的 Mihomo (Clash Meta) 核心配置文件。偏向 **稳定、解耦、低维护成本**。

---

## ✨ 配置核心亮点

### 🗺️ 精准地域策略组

内置精细化的全球节点空间划分，采用 **显式手动选择组** 与 **后台隐式延迟测速组（url-test）** 动态联动机制。同时，后台自动测速组已剔除 Hysteria2 协议：

| 节点分组标签 | 后台自动测速组（隐式隐藏） |
| --- | --- |
| 🔓 **Unlock** | `UL-Auto` |
| 🌍 **Global** | `GB-Auto` |
| 🇭🇰 **Hong Kong** | `HK-Auto` |
| 🇨🇳 **Taiwan Provience** | `TW-Auto` |
| 🇯🇵 **Japan** | `JP-Auto` |
| 🇰🇷 **Korea** | `KR-Auto` |
| 🇸🇬 **Singapore** | `SG-Auto` |
| 🇺🇸 **United States** | `US-Auto` |

---

### 🧠 深度解耦

本配置的底层进化逻辑是：**稳定 > 清晰 > 自动化**。
不追求臃肿无用的千万条规则，
针对日常高频使用的海内外主流服务与广告拦截配置了独立策略组，支持一键在 UI 界面快速切换出口：

> 🧩 `AdGuard` · `AI` · `TikTok` · `Anime` · `Media` · `Others`

*💡 特别针对二次元受众与流媒体，合并并优化了 `Anime` 与 `Media` 策略组。全面覆盖巴哈姆特、Niconico、Netflix、YouTube、Disney+、Emby 等，并在规则中手动附加了次元城动漫（cycani）、AGE动漫（agedm）的域名分流。*

---

## 🛡️ 广告拦截与防护

配置中集成了轻量化的高效广告拦截规则集（`adblockmihomolite`），并独设 **`AdGuard`** 核心控制策略组。支持在前端 UI 动态切换三种拦截强度，满足不同场景下的去广告需求：

* **Strict**：映射 `REJECT`
* **Moderate**：映射 `REJECT-DROP`
* **Permissive**：映射 `PASS`，临时进行放行恢复。

---

## 📂 订阅与节点解耦管理

配置顶部引入了模块化 **声明锚点** 机制，实现了订阅源（Proxy Providers）与策略组的彻底解耦。同时引入了 **全局节点过滤器**（`global_exclude_filter`），从源头过滤掉机场的通知、官网、剩余流量等无效节点。

你只需在顶层追加或修改订阅链接，策略组即可实现自动化无缝动态加载：

```yaml
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

```

*💡 通过 Provider 统一托管，后端自动健康检查与并发测速。*

---

## ⚠️ 声明与须知

* 本仓库为个人自用配置共享，**不提供任何节点、不提供任何机场订阅服务**。
* 使用前请自行在 `proxy-providers` 节点填写个人的有效订阅。
* 路由分流规则带有强烈的个人开发者与追番使用习惯，已内置 **PCDN 域名屏蔽（如哔哩哔哩卡顿优化）** 与 **QUIC 流量禁用** 规则，可根据具体业务场景自行调整 `nameserver-policy` 与 `rules`。

---

## 📜 License

Configured under learning and communication purposes. All rights reserved.

## 💖 鸣谢

本项目在开发过程中参考了以下优秀开源项目：

* [AIsouler/MyClash](https://github.com/AIsouler/MyClash)
