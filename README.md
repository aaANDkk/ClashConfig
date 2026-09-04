# 🐱 𝕄𝕚𝕙𝕠𝕞𝕠 / ℂ𝕝𝕒𝕤𝕙 ℂ𝕠𝕟𝕗𝕚𝕘
偏向 **稳定、解耦** 的个人自用 Mihomo / Clash Meta 配置方案。
* **📝 YAML 配置**：开箱即用，支持多订阅聚合与自定义规则。
* **⚙️ JS 预处理脚本**：支持远程 URL 链式加载，无需手动反复合并订阅。
---
## ✨ 配置亮点
### 🗺️ 精准地域与隐式测速
采用 **显式手动选择** 与 **后台隐式自动测速 (`url-test`)** 联动设计，自动测速组默认过滤低倍率及部分本人不喜欢的协议。

| 节点分组 | 自动测速组 | 适用场景 |
| :--- | :--- | :--- |
| **Residential** | `RSD-Auto` | 家宽解锁与风控服务 |
| **Hong Kong** | `HKG-Auto` | 低延迟通用出口 |
| **Taiwan Province of China** | `TWN-Auto` | 巴哈姆特等台区限制内容 |
| **Japan** | `JPN-Auto` | 日区流媒体与 DMM/Niconico |
| **Singapore** | `SGP-Auto` | 东南亚与海外通用节点 |
| **United States** | `USA-Auto` | AI 服务与美区专用 |
| **Rest of World** | `ROW-Auto` | 其他冷门区域分流 |

### 🧠 业务与媒体解耦
* **独立分流出口**：核心高频业务独立分流，支持快速切换：
  > `AI` · `TikTok` · `动漫` · `流媒体`
* **二次元深度优化**：针对海外流媒体（Netflix/Disney+/巴哈姆特等）与番剧站（次元城 `cycani`、AGE 动漫 `agedm` 等）进行域名定制分流，规避部分动漫站点屏蔽日区 IP 的问题。
* **网络净化**：内置轻量广告过滤规则及 **PCDN 屏蔽 / QUIC 禁用**，解决 B 站视频卡顿等部分问题。
---
## 🚀 快速上手
### 方式一：YAML 配置文件导入
下载 YAML 文件至本地，在 `proxy-providers` 下替换为个人的订阅链接：
```yaml
proxy-providers:
  Provider_A:
    <<: [*p, *global_exclude_filter]
    url: "填入1号机场订阅"
    override:
      additional-prefix: "① "
  Provider_B:
    <<: [*p, *global_exclude_filter]
    url: "填入2号机场订阅"
    override:
      additional-prefix: "② "
```
### 方式二：客户端 JS 脚本远程导入
如果客户端支持订阅转换或 Remote Script（如 Bettbox / FlClash 等），直接填入 Raw 链接：
```text
[https://raw.githubusercontent.com/aaANDkk/ClashConfig/main/mihomo.js](https://raw.githubusercontent.com/aaANDkk/ClashConfig/main/mihomo.js)
```
> **注意**：若客户端不支持远程脚本，可直接复制仓库脚本源码覆盖至客户端脚本配置中。
---
## ⚠️ 免责声明
* 本项目仅为配置逻辑共享，**不提供任何节点或机场订阅**。
* 分流规则高度贴合个人开发与追番习惯，使用前可根据自身网络环境微调。
---
## 💖 鸣谢（参考了以下优秀项目）
* [AIsouler/MyClash](https://github.com/AIsouler/MyClash)