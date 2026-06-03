
# 🚀 Mihomo / Clash Meta 自用分流配置

<p align="center">
  <img src="https://img.shields.io/badge/Kernel-Mihomo%20%2F%20Clash%20Meta-blue?style=flat-square&logo=go" alt="Kernel">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Android%20%7C%20Linux-orange?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/Style-Stable%20%26%20Clean-green?style=flat-square" alt="Style">
</p>

一个偏向 **稳定、易维护、低折腾** 的 Mihomo（Clash Meta）分流配置文件。

---

## ✨ 配置特点

### 🗺️ 地区分组
内置精细化的地区分类，各地区均提供**独立手动选择组**，并联动隐藏的**后台延迟自动测速组**：

| 地区标签 | 覆盖节点类型 | 地区标签 | 覆盖节点类型 |
| :--- | :--- | :--- | :--- |
| 🇭🇰 **香港** | 港区低延迟节点 | 🇨🇳 **台湾** | 台区动画疯等专用 |
| 🇯🇵 **日本** | 日区原生/流媒体 | 🇰🇷 **韩国** | 韩区特定服务节点 |
| 🇸🇬 **新加坡** | 狮城落地高带宽 | 🇺🇸 **美国** | 美区全服务兼容 |
| 🌍 **其它地区**| 欧洲/小众冷门节点 | 💰 **低倍率** | 机场福利/省流量节点 |

---

### 📱 常用服务分流
针对日常高频使用的服务进行了独立策略组分流，支持根据需求自由指定出口地区：
> 🧩 `AI` · `Google 全家桶` · `YouTube` · `TikTok` · `巴哈姆特` · `哔哩哔哩` · `Netflix` · `Spotify` · `GitHub`

---

### 🤖 AI 服务优化
针对大模型及开发工具链进行了域名全包覆盖，流量统一进入 **AI 专用分组** 管理，防跳 IP 锁区：
* 🧠 **LLMs:** ChatGPT / Claude / Grok / Perplexity
* 🎨 **Creatives:** Midjourney
* 🛠️ **Dev Tools:** OpenRouter / Devv

---

### 🔒 DNS 配置
> 采用 **Fake-IP 模式** + **纯国内大厂 DoH 引导**
* **Respect-Rules:** 核心逻辑强制遵守规则，彻底杜绝开机抢跑。
* **GeoSite / GeoIP 规则分流:** 完美兼顾解析速度与极端环境下的兼容性。
* **安全性:** 深度优化配置，大幅降低 DNS 泄漏风险。

---

### 🔍 Sniffer 支持
* 开启高级端口嗅探：`HTTP` (80/8080-8880) ｜ `TLS` (443/8443) ｜ `QUIC` (443/8443)
* 配合域名/IP跳过名单，显著提升动态规则命中率，还原真实请求生态。

---

### 🔋 移动网络优化
针对手机移动端复杂场景进行了专项参数调优：
* **网络切换重置连接:** Wi-Fi 与移动数据切换时瞬间重置网络栈，彻底断开残留死连接。
* **自动检测网络接口:** 智能适应当前活跃网卡，降低断连感。
* **UDP 超时优化:** 强制旧残留连接快速消亡，逼迫设备平滑过渡至新网络。

---

## 📂 节点管理

采用 `Proxy-Providers` 订阅源解耦设计。配置顶部内置了全局锚点，你只需要集中维护订阅，策略组将自动完成动态加载与同步：

```yaml
proxy-providers:
  prov1: { <<: *p, url: "https://..." }
  prov2: { <<: *p, url: "https://..." }
  prov3: { <<: *p, url: "https://..." }

```

*💡 抛弃传统长篇大论的节点列表，通过 Provider 统一管理节点，无需手动维护节点列表。*

---

## 🎯 设计目标

本配置的底层逻辑是：**稳定 > 清晰 > 易维护**。
我们不追求复杂规则或极限性能，而是专注于日常的主流体验。

如果你需要一个开箱即用、后续修改成本极低，且能完美胜任以下场景的配置：

* 🌐 日常网页浏览
* 💬 AI 工具使用
* 📺 流媒体观看
* 💻 GitHub 开发

那么开箱即可使用，并且后续修改成本较低。

---

## ⚠️ 说明

* 本仓库不提供任何节点服务。
* 使用前请自行填写订阅地址。
* 规则及策略组仅代表个人使用习惯，可根据需要自行调整。

---

## 📜 License

仅供学习与交流使用。

```

