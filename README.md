
# 🚀 Mihomo / Clash Meta 分流配置

一个深度调优的 Mihomo (Clash Meta) 核心配置文件。偏向 **极端稳定、结构解耦、低维护成本**。

---

## ✨ 配置核心亮点

### 🗺️ 精准地域策略组

内置精细化的全球节点空间划分，采用 **显式手动选择组** 与 **后台隐式延迟测速组（url-test）** 动态联动机制。同时，后台自动测速组已剔除 Hysteria2 协议以确保极端稳定性：

| 节点分组标签 | 后台自动测速组 |
| --- | --- |
| 🔓 **解锁节点** | `解锁节点-自动选择` |
| 🌍 **其他地区** | `其他地区-自动选择` |
| 🇭🇰 **香港** | `香港-自动选择` |
| 🇨🇳 **台湾** | `台湾-自动选择` |
| 🇯🇵 **日本** | `日本-自动选择` |
| 🇰🇷 **韩国** | `韩国-自动选择` |
| 🇸🇬 **狮城** | `狮城-自动选择` |
| 🇺🇸 **美国** | `美国-自动选择` |

---

### 🧠 深度解耦

针对日常高频使用的海内外主流服务配置了独立策略组，支持一键在 UI 界面快速切换出口：

> 🧩 `AI` · `YouTube` · `TikTok` · `Niconico` · `Anime (动画疯/次元城/特定追番App)` · `NETFLIX` · `Emby` · `Others`

*💡 特别针对二次元受众，合并并优化了 `Anime` 策略组，全面覆盖巴哈姆特、次元城动漫（cycani）、AGE动漫（agedm），并对 Kazumi 等播放器进程进行了分流寻址。*

针对当前主流大模型及开发者生态进行了 **全包围式域名与规则覆盖**。流量全量并入 `人工智能` 专用策略组：

* 💬 **核心对话:** OpenAI (ChatGPT) / Claude.ai
* 🛠️ **基础设施:** OpenRouter.ai / Devv.ai

---

### 🔒 DNS 架构

> 采用 **Fake-IP 模式** + **DoH 异步解析** + **策略路由拦截**

* **分流无缝映射:** 引入 `chinaDNS` 与 `foreignDNS` 统一锚点。国内域名由阿里/腾讯 DoH响应；国外域名及 Fake-IP 映射由 Cloudflare/Google 在代理网络内安全解析，杜绝 DNS 污染与泄漏。

---

### 🔋 移动端与网络环境自适应调优

针对网络场景进行优化：

* **断连瞬时重置 `reset-network-change`:** 在 Wi-Fi、蜂窝移动网络交替切换时瞬间重置网络栈，斩断残留连接。
* **严格路由阻断:** 针对 Google 系服务执行 UDP 拦截（对 `google` 规则集强行 `REJECT-DROP` 443 端口），强迫流量平滑回落至 TCP 轨道，提升抗丢包稳定性。
* **严格进程寻址 `find-process-mode: strict`:** 精准控制本地安卓/桌面端进程流量，确保网络沙箱环境的绝对安全。

---

## 📂 订阅与节点解耦管理

配置顶部引入了模块化 **声明锚点** 机制，实现了订阅源（Proxy Providers）与策略组的彻底解耦。同时引入了 **全局节点过滤器**，从源头过滤掉机场的通知、官网、剩余流量等无效节点。

你只需在顶层追加或修改订阅链接，策略组即可实现自动化无缝动态加载：

```yaml
proxy-providers:
  P1:
    <<: [*p, *global_exclude_filter]
    url: "填入订阅"     # 订阅1
    override:
      additional-prefix: "[P1]"

  P2:
    <<: [*p, *global_exclude_filter]
    url: "填入订阅"     # 订阅2
    override:
      additional-prefix: "[P2]"

```

*💡 通过 Provider 统一托管，后端自动完成 24 小时健康检查与并发测速。*

---

## 🎯 核心设计观

本配置的底层进化逻辑是：**稳定 > 清晰 > 极致自动化**。
不追求臃肿无用的千万条黑名单规则，而是专注于为以下日常场景提供网络支撑：

* 💻 AI 辅助（Devv/OpenRouter/Claude）
* 📺 国际流媒体与御宅追番（Netflix/巴哈姆特/YouTube 4K）

---

## ⚠️ 声明与须知

* 本仓库为个人自用配置共享，**不提供任何节点、不提供任何机场订阅服务**。
* 使用前请自行在 `proxy-providers` 节点填写个人的有效订阅。
* 路由分流规则带有强烈的个人开发者与追番使用习惯，可根据具体业务场景自行调整 `nameserver-policy` 与 `rules`。

---

## 📜 License

Configured under learning and communication purposes. All rights reserved.

## 鸣谢
本项目在开发过程中参考了以下优秀开源项目：
- [AIsouler/MyClash](https://github.com/AIsouler/MyClash/tree/main)
