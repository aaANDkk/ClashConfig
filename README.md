# 🐱 Mihomo / Clash Config

个人自用 Mihomo / Clash Meta 配置，提供 YAML、JS 预处理脚本和自绘 Qure 风格 SVG 图标。不提供节点或机场订阅。

## 🚀 使用方式

点击代码块右上角的复制按钮即可复制链接。

### YAML 配置

可直接导入 **FlClash 的自定义配置**：

```text
https://raw.githubusercontent.com/aaANDkk/ClashConfig/main/mihomo.yaml
```

也可下载 [mihomo.yaml](mihomo.yaml)，在 `proxy-providers` 中填入自己的订阅链接后导入。

### JS 预处理脚本

在支持订阅 JS 预处理的客户端中添加 [mihomo.js](mihomo.js)，远程脚本链接：

```text
https://raw.githubusercontent.com/aaANDkk/ClashConfig/main/mihomo.js
```

## ✨ 配置亮点

- **业务分流**：AI、Google、GitHub、Telegram、动漫和流媒体等独立分组，搭配手动选择与后台自动测速。
- **动态地区组**：JS 支持 51 个常见地区，手动可见节点满 **3 个**即生成地区组，家宽有 **1 个**即生成。直连也计数并保留在手动组，仅在自动测速中排除；YAML 使用固定分组。
- **私有 DNS**：JS 自动提取订阅中的私有 DNS，保留节点域名解析策略与 Hosts 映射。
- **拦截开关**：`AdBlock`、`WebRTC`、`QUIC` 默认 `Reject`，可切换 `Pass` 临时放行；内置部分 PCDN 屏蔽规则。

JS 仅统计客户端传入的节点，不主动下载远程 provider；未单独分组的节点仍可在 `All Proxies` 中选择。补充规则见 [动漫](rules/anime.yaml) / [流媒体](rules/media.yaml)。

## 🎨 Qure 风格 SVG 图标

[通用 SVG 图标](icon/svg/common) · [地区旗帜 SVG](icon/svg/flag) · [PNG 素材](icon/png)

### 通用图标 · 1491 个

全部 SVG 素材已统一为 **144×144**。通用图标覆盖业务、策略和网络工具，支持查看[可缩放 SVG](docs/assets/common-overview.svg?v=526704a05bf9)或[逐项索引](icon/svg/common/README.md)。

[![Qure 风格通用图标总览：1491 个 144×144 SVG](docs/assets/common-overview.png?v=dfbc30922ded)](docs/assets/common-overview.png?v=dfbc30922ded)

### 地区旗帜 · 270 个

共 **270 个旗帜图标**，按英文文件名排序并附中文名称。点击下图查看大图，也可查看[可缩放 SVG](docs/assets/flags-overview.svg?v=0690fcf44ee5)或[逐项索引](icon/svg/flag/README.md)。

[![Qure 风格地区旗帜总览：270 个旗帜图标](docs/assets/flags-overview.png?v=6301c96bb2fd)](docs/assets/flags-overview.png?v=6301c96bb2fd)

图标链接示例，文件名区分大小写：

```yaml
icon: "https://fastly.jsdelivr.net/gh/aaANDkk/ClashConfig@main/icon/svg/flag/Japan.svg"
```

## 💖 鸣谢

- [AIsouler/MyClash](https://github.com/AIsouler/MyClash)：DNS、Hosts 与策略分组处理参考。
- [Koolson/Qure](https://github.com/Koolson/Qure)：图标风格参考。
